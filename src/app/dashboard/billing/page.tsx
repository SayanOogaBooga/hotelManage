"use client";

import { useState, useEffect } from "react";
import { useForm, useFieldArray, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { numberToWords } from "@/lib/numberToWords";
import {
  Plus,
  Trash2,
  Printer,
  Save,
  CheckCircle2,
  RefreshCw,
} from "lucide-react";
import { format } from "date-fns";
import { DatePicker } from "@/components/ui/date-picker";
import toast from "react-hot-toast";
import { ReceiptPrint } from "@/components/ReceiptPrint";
import { playSuccessSound } from "@/lib/sounds";
import { generatePdfFromElement } from "@/lib/generatePdf";

// Define the Zod Validation Schema
const particularSchema = z.object({
  slNo: z.number().min(1, "Required"),
  description: z.string().min(2, "Description is required"),
  noOfHead: z.number().min(1, "Must be at least 1"),
  ratePerHeadDay: z.number().min(0, "Invalid rate"),
});

const billingSchema = z.object({
  memoNo: z.string().min(1, "Memo No is required"),
  date: z.string().min(1, "Date is required"),
  guestName: z.string().min(2, "Guest Name is required"),
  address: z.string().optional(),
  mobileNo: z.string().min(10, "Valid mobile no is required"),
  checkIn: z.string().optional(),
  checkOut: z.string().optional(),
  roomsBooked: z.array(z.string()).min(1, "Please assign at least one room"),
  particulars: z
    .array(particularSchema)
    .min(1, "At least one particular is required"),
  advancePayment: z.number().min(0).optional(),
  paymentMode: z.enum(["Cash", "UPI", "Bank Transfer", "Others"]),
});

type FormValues = z.infer<typeof billingSchema>;

export default function BillingPage() {
  const [isSaving, setIsSaving] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [showPrintModal, setShowPrintModal] = useState(false);
  const [isLoadingExisting, setIsLoadingExisting] = useState(false);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [availableRooms, setAvailableRooms] = useState<any[]>([]);

  const {
    register,
    control,
    watch,
    handleSubmit,
    reset,
    setValue,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(billingSchema),
    defaultValues: {
      memoNo: "",
      date: new Date().toISOString().split("T")[0],
      guestName: "",
      address: "",
      mobileNo: "",
      checkIn: "",
      checkOut: "",
      roomsBooked: [],
      particulars: [
        { slNo: 1, description: "", noOfHead: 1, ratePerHeadDay: 0 },
      ],
      advancePayment: 0,
      paymentMode: "Cash",
    },
    mode: "onChange",
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "particulars",
  });

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const id = params.get("id");
    if (id) {
      setIsLoadingExisting(true);
      fetch(`/api/bookings?id=${id}`)
        .then((res) => res.json())
        .then((data) => {
          if (!data.error) {
            reset({
              ...data,
              advancePayment: data.advancePayment || 0,
              date: data.date
                ? new Date(data.date).toISOString().split("T")[0]
                : "",
              checkIn: data.checkIn
                ? new Date(data.checkIn).toISOString().split("T")[0]
                : "",
              checkOut: data.checkOut
                ? new Date(data.checkOut).toISOString().split("T")[0]
                : "",
              roomsBooked: data.roomsBooked
                ? data.roomsBooked.map((r: any) => r._id || r)
                : [],
            });
            // Intentionally not setting isSaved to true here, 
            // so the user can actually save their edits!
          }
        })
        .finally(() => setIsLoadingExisting(false));
    } else {
      // Fetch dynamic memo number for new bills
      fetch("/api/memo")
        .then((res) => res.json())
        .then((data) => {
          if (data.memoNo) {
            const defaultCheckIn = params.get("checkIn") || "";
            const defaultCheckOut = params.get("checkOut") || "";
            reset((formValues) => ({
              ...formValues,
              memoNo: data.memoNo,
              checkIn: defaultCheckIn,
              checkOut: defaultCheckOut,
            }));
          }
        });
    }
  }, [reset]);

  const watchCheckIn = watch("checkIn");
  const watchCheckOut = watch("checkOut");

  // Dynamically fetch and calculate available rooms based on dates
  useEffect(() => {
    if (!watchCheckIn || !watchCheckOut) {
      setAvailableRooms([]);
      return;
    }

    Promise.all([fetch("/api/rooms"), fetch("/api/bookings")])
      .then(async ([roomsRes, bookingsRes]) => {
        const rooms = await roomsRes.json();
        const bookings = await bookingsRes.json();

        const getMidnightTime = (date: string | Date) => {
          const d = new Date(date);
          d.setHours(0, 0, 0, 0);
          return d.getTime();
        };

        const start = getMidnightTime(watchCheckIn);
        const end = getMidnightTime(watchCheckOut);

        if (start >= end) {
          setAvailableRooms([]);
          return;
        }

        const params = new URLSearchParams(window.location.search);
        const editId = params.get("id");

        const bookedRoomIds = new Set();
        bookings.forEach((b: any) => {
          if (editId && b._id === editId) return; // Skip currently edited booking

          if (b.checkIn && b.checkOut && b.roomsBooked) {
            const bStart = getMidnightTime(b.checkIn);
            const bEnd = getMidnightTime(b.checkOut);
            if (start < bEnd && end > bStart) {
              b.roomsBooked.forEach((r: any) => bookedRoomIds.add(r._id || r));
            }
          }
        });

        const freeRooms = rooms.filter((r: any) => !bookedRoomIds.has(r._id));
        setAvailableRooms(freeRooms);
      })
      .catch((err) => console.error(err));
  }, [watchCheckIn, watchCheckOut]);

  // Watch for dynamic calculation without forcing re-renders via setValue loop
  const watchParticulars = watch("particulars");
  const watchAdvancePayment = watch("advancePayment") || 0;

  // Calculate dynamically during render
  let daysBooked = 1;
  if (watchCheckIn && watchCheckOut) {
    const start = new Date(watchCheckIn).getTime();
    const end = new Date(watchCheckOut).getTime();
    if (end > start) {
      daysBooked = Math.max(
        1,
        Math.ceil((end - start) / (1000 * 60 * 60 * 24)),
      );
    }
  }

  const calculatedParticulars = fields.map((field, index) => {
    const current = watchParticulars?.[index] || field;
    const amount =
      (current.noOfHead || 0) * (current.ratePerHeadDay || 0) * daysBooked;
    return { ...current, amount };
  });

  const subTotal = calculatedParticulars.reduce(
    (sum, item) => sum + item.amount,
    0,
  );
  const totalAmount = subTotal;
  const remainingAmount = Math.max(0, totalAmount - watchAdvancePayment);
  const amountInWords = numberToWords(totalAmount);

  const onSubmit = async (data: FormValues) => {
    setIsSaving(true);
    try {
      // Map the dynamically calculated amounts back into the payload before sending
      const payloadParticulars = data.particulars.map((p) => ({
        ...p,
        amount: (p.noOfHead || 0) * (p.ratePerHeadDay || 0) * daysBooked,
      }));

      const payload = {
        ...data,
        particulars: payloadParticulars,
        subTotal,
        totalAmount,
        advancePayment: watchAdvancePayment,
        remainingAmount,
        amountInWords,
        date: new Date(data.date),
        checkIn: data.checkIn ? new Date(data.checkIn) : null,
        checkOut: data.checkOut ? new Date(data.checkOut) : null,
      };

      const params = new URLSearchParams(window.location.search);
      const editId = params.get("id");

      const url = editId ? `/api/bookings?id=${editId}` : "/api/bookings";
      const method = editId ? "PATCH" : "POST";

      const res = await fetch(url, {
        method: method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        setIsSaved(true);
        playSuccessSound();
        toast.success(
          editId ? "Bill updated successfully!" : "Bill saved successfully!",
        );
        setShowPrintModal(true);
      } else {
        const err = await res.json();
        toast.error(err.error || "Failed to save booking");
      }
    } catch (e) {
      toast.error("Network error while saving booking");
    } finally {
      setIsSaving(false);
    }
  };

  const handlePrint = async () => {
    setIsGeneratingPdf(true);
    const success = await generatePdfFromElement(
      "receipt-print",
      `Bill-${watch("memoNo") || "Receipt"}.pdf`,
    );
    setIsGeneratingPdf(false);
    if (success) {
      toast.success("PDF Downloaded!");
    } else {
      toast.error("Failed to generate PDF");
    }
  };

  return (
    <div className="max-w-6xl mx-auto pb-24 print:pb-0 print:m-0 print:max-w-none">
      {/* --- WEB FORM UI (Hidden when printing) --- */}
      <div className="print:hidden space-y-6 md:space-y-8">
        <div className="flex flex-col gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-slate-800">
              Create Memo / Receipt
            </h1>
            <p className="text-sm md:text-base text-slate-500 mt-1">
              Fill the details to auto-calculate amounts and generate a
              printable receipt.
            </p>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 md:p-8 space-y-8">
          <div className="grid grid-cols-2 gap-3 sm:gap-6">
            <div className="space-y-1">
              <label className="text-sm font-semibold text-slate-700">
                Memo No.
              </label>
              <input
                readOnly
                {...register("memoNo")}
                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary/50 bg-slate-50 cursor-not-allowed ${errors.memoNo ? "border-red-500 bg-red-50" : "border-slate-200"}`}
              />
              {errors.memoNo && (
                <p className="text-red-500 text-xs mt-1">
                  {errors.memoNo.message}
                </p>
              )}
            </div>

            <div className="space-y-1">
              <label className="text-sm font-semibold text-slate-700">
                Date
              </label>
              <Controller
                control={control}
                name="date"
                render={({ field }) => (
                  <DatePicker value={field.value} onChange={field.onChange} />
                )}
              />
              {errors.date && (
                <p className="text-red-500 text-xs mt-1">
                  {errors.date.message}
                </p>
              )}
            </div>

            <div className="space-y-1">
              <label className="text-sm font-semibold text-slate-700">
                Guest Name
              </label>
              <input
                {...register("guestName")}
                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary/50 ${errors.guestName ? "border-red-500 bg-red-50" : "border-slate-200"}`}
              />
              {errors.guestName && (
                <p className="text-red-500 text-xs mt-1">
                  {errors.guestName.message}
                </p>
              )}
            </div>

            <div className="space-y-1">
              <label className="text-sm font-semibold text-slate-700">
                Mobile No.
              </label>
              <input
                {...register("mobileNo", {
                  onChange: (e) => {
                    e.target.value = e.target.value.replace(/\D/g, "").slice(0, 10);
                  },
                })}
                type="text"
                inputMode="numeric"
                maxLength={10}
                placeholder="10-digit mobile number"
                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary/50 ${errors.mobileNo ? "border-red-500 bg-red-50" : "border-slate-200"}`}
              />
              {errors.mobileNo && (
                <p className="text-red-500 text-xs mt-1">
                  {errors.mobileNo.message}
                </p>
              )}
            </div>

            <div className="space-y-1 col-span-2">
              <label className="text-sm font-semibold text-slate-700">
                Address
              </label>
              <input
                {...register("address")}
                className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-primary/50"
              />
            </div>

            <div className="space-y-1">
              <label className="text-sm font-semibold text-slate-700">
                Check In
              </label>
              <Controller
                control={control}
                name="checkIn"
                render={({ field }) => (
                  <DatePicker
                    value={field.value}
                    onChange={(date) => field.onChange(date)}
                    minDate={new Date()}
                    highlightAvailability
                  />
                )}
              />
            </div>

            <div className="space-y-1">
              <label className="text-sm font-semibold text-slate-700">
                Check Out
              </label>
              <Controller
                control={control}
                name="checkOut"
                render={({ field }) => (
                  <DatePicker
                    value={field.value}
                    onChange={(date) => field.onChange(date)}
                    minDate={watchCheckIn ? new Date(watchCheckIn) : new Date()}
                    highlightAvailability
                  />
                )}
              />
            </div>

            <div className="space-y-1 col-span-2">
              <label className="text-sm font-semibold text-slate-700 flex items-center justify-between">
                <span>
                  Assign Rooms <span className="text-rose-500">*</span>
                </span>
                {errors.roomsBooked && (
                  <span className="text-xs font-bold text-rose-500 bg-rose-50 px-2 py-0.5 rounded-md animate-pulse">
                    {errors.roomsBooked.message}
                  </span>
                )}
              </label>
              <div className="flex flex-wrap gap-3 mt-2">
                {availableRooms.map((room) => {
                  const isSelected = watch("roomsBooked")?.includes(room._id);
                  return (
                    <button
                      key={room._id}
                      type="button"
                      onClick={() => {
                        const current = watch("roomsBooked") || [];
                        if (isSelected) {
                          setValue(
                            "roomsBooked",
                            current.filter((id: string) => id !== room._id),
                            { shouldValidate: true, shouldDirty: true },
                          );
                        } else {
                          setValue("roomsBooked", [...current, room._id], {
                            shouldValidate: true,
                            shouldDirty: true,
                          });
                        }
                      }}
                      className={`relative group flex items-center gap-2 px-5 py-3 rounded-xl text-sm font-bold transition-all duration-300 cursor-pointer overflow-hidden ${
                        isSelected
                          ? "bg-gradient-to-br from-emerald-500 to-emerald-700 text-white shadow-lg shadow-emerald-200/50 scale-[1.02] -translate-y-0.5"
                          : "bg-white text-slate-600 border border-slate-200 hover:border-emerald-300 hover:bg-emerald-50 hover:text-emerald-700 hover:shadow-md hover:-translate-y-0.5"
                      }`}
                    >
                      {/* Smooth background hover effect for unselected */}
                      {!isSelected && (
                        <div className="absolute inset-0 bg-emerald-100/50 translate-y-[100%] group-hover:translate-y-0 transition-transform duration-300 ease-out" />
                      )}

                      <span className="relative z-10 flex items-center gap-2">
                        {isSelected && (
                          <CheckCircle2
                            size={16}
                            className="text-white animate-in zoom-in spin-in-12 duration-300"
                          />
                        )}
                        <span className="text-base">{room.roomNumber}</span>
                        {/* <span className={`font-medium text-xs px-2 py-0.5 rounded-md ${isSelected ? 'bg-black/20 text-emerald-50' : 'bg-slate-100 text-slate-500 group-hover:bg-white group-hover:text-emerald-600'}`}>
                          {room.category}
                        </span> */}
                      </span>
                    </button>
                  );
                })}
                {availableRooms.length === 0 && (
                  <div className="w-full p-4 rounded-xl border border-dashed border-slate-300 bg-slate-50/50 flex flex-col items-center justify-center text-center">
                    <p className="text-sm font-semibold text-slate-500">
                      {!watchCheckIn || !watchCheckOut
                        ? "Select Check-in and Check-out dates to reveal available rooms."
                        : "No rooms available for the selected dates."}
                    </p>
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-sm font-semibold text-slate-700">
                Payment Mode
              </label>
              <select
                {...register("paymentMode")}
                className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-primary/50 bg-white"
              >
                <option value="Cash">Cash</option>
                <option value="UPI">UPI</option>
                <option value="Bank Transfer">Bank Transfer</option>
                <option value="Others">Others</option>
              </select>
            </div>
          </div>

          <div className="border-t border-slate-200 pt-8">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
              <h3 className="text-lg font-bold text-slate-800">Particulars</h3>
              <div className="bg-blue-50 text-blue-700 px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 border border-blue-100">
                <span className="bg-blue-200 text-blue-800 w-4 h-4 rounded-full flex items-center justify-center text-[10px]">
                  i
                </span>
                Formula: (No. of Heads × Rate) × {daysBooked}{" "}
                {daysBooked === 1 ? "Day" : "Days"} Booked
              </div>
            </div>

            <div className="space-y-4">
              {fields.map((field, index) => {
                const particularError = errors.particulars?.[index];
                const dynamicAmount = calculatedParticulars[index]?.amount || 0;

                return (
                  <div
                    key={field.id}
                    className={`grid grid-cols-1 md:grid-cols-12 gap-4 items-end bg-slate-50 p-4 md:p-6 rounded-xl border relative group ${particularError ? "border-red-200" : "border-slate-100"}`}
                  >
                    <div className="md:col-span-1 space-y-1">
                      <label className="text-xs font-semibold text-slate-500">
                        Sl No.
                      </label>
                      <input
                        type="number"
                        {...register(`particulars.${index}.slNo`, {
                          valueAsNumber: true,
                        })}
                        className="w-full px-3 py-2 border rounded-lg bg-white"
                      />
                    </div>
                    <div className="md:col-span-5 space-y-1">
                      <label className="text-xs font-semibold text-slate-500">
                        Particular Description
                      </label>
                      <input
                        {...register(`particulars.${index}.description`)}
                        placeholder="e.g. Room Rent (101)"
                        className={`w-full px-3 py-2 border rounded-lg bg-white ${particularError?.description ? "border-red-500" : ""}`}
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4 md:col-span-4">
                      <div className="space-y-1">
                        <label className="text-xs font-semibold text-slate-500">
                          No. of Head
                        </label>
                        <input
                          type="number"
                          {...register(`particulars.${index}.noOfHead`, {
                            valueAsNumber: true,
                          })}
                          onWheel={(e) => (e.target as HTMLElement).blur()}
                          onKeyDown={(e) => {
                            if (["e", "E", "+", "-"].includes(e.key)) e.preventDefault();
                          }}
                          className={`w-full px-3 py-2 border rounded-lg bg-white ${particularError?.noOfHead ? "border-red-500" : ""}`}
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-semibold text-slate-500">
                          Rate (₹)
                        </label>
                        <input
                          type="number"
                          {...register(`particulars.${index}.ratePerHeadDay`, {
                            valueAsNumber: true,
                          })}
                          onWheel={(e) => (e.target as HTMLElement).blur()}
                          onKeyDown={(e) => {
                            if (["e", "E", "+", "-"].includes(e.key)) e.preventDefault();
                          }}
                          className={`w-full px-3 py-2 border rounded-lg bg-white ${particularError?.ratePerHeadDay ? "border-red-500" : ""}`}
                        />
                      </div>
                    </div>
                    <div className="md:col-span-2 space-y-1 relative">
                      <label className="text-xs font-semibold text-slate-500">
                        Amount (₹)
                      </label>
                      <div className="w-full px-3 py-2 border border-emerald-200 bg-emerald-50 text-emerald-800 font-bold rounded-lg flex items-center h-[42px]">
                        {dynamicAmount.toFixed(2)}
                      </div>
                      <p
                        className="absolute -bottom-5 left-0 w-full text-[10px] text-slate-400 font-medium truncate"
                        title={`${watchParticulars?.[index]?.noOfHead || 0} heads × ₹${watchParticulars?.[index]?.ratePerHeadDay || 0} × ${daysBooked} days`}
                      >
                        ({watchParticulars?.[index]?.noOfHead || 0} × ₹
                        {watchParticulars?.[index]?.ratePerHeadDay || 0} ×{" "}
                        {daysBooked}d)
                      </p>
                    </div>

                    {fields.length > 1 && (
                      <button
                        type="button"
                        onClick={() => remove(index)}
                        className="absolute -right-2 -top-2 md:-right-3 md:-top-3 bg-rose-100 text-rose-600 p-2 rounded-full shadow-sm md:opacity-0 group-hover:opacity-100 transition-all z-10 border border-white cursor-pointer hover:scale-110 active:scale-95"
                      >
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>
                );
              })}
              {errors.particulars?.root && (
                <p className="text-red-500 text-sm mt-1">
                  {errors.particulars.root.message}
                </p>
              )}

              <button
                type="button"
                onClick={() =>
                  append({
                    slNo: fields.length + 1,
                    description: "",
                    noOfHead: 1,
                    ratePerHeadDay: 0,
                  })
                }
                className="text-sm font-medium text-primary bg-primary/10 px-4 py-2 rounded-lg hover:bg-primary/20 transition-all flex items-center gap-2 cursor-pointer hover:-translate-y-0.5 active:translate-y-0 hover:shadow-sm"
              >
                <Plus size={16} /> Add Particular
              </button>
            </div>
          </div>

          <div className="border-t border-slate-200 pt-6 grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="bg-slate-50 p-6 rounded-xl border border-slate-100 flex items-center justify-center text-center">
              <div>
                <p className="text-sm font-medium text-slate-500 mb-1">
                  Amount in Words
                </p>
                <p className="font-semibold text-slate-800 italic">
                  {amountInWords}
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex justify-between items-center px-4 py-2">
                <span className="font-medium text-slate-600">Sub Total</span>
                <span className="font-bold text-slate-800">
                  ₹ {subTotal.toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between items-center px-4 py-3 bg-emerald-50 rounded-xl border border-emerald-200 shadow-sm">
                <span className="font-bold text-emerald-800 text-lg">
                  Total Amount
                </span>
                <span className="font-bold text-emerald-800 text-xl">
                  ₹ {totalAmount.toFixed(2)}
                </span>
              </div>

              <div className="flex justify-between items-center px-4 py-2 bg-slate-50 rounded-lg mb-2 mt-4">
                <span className="font-medium text-slate-600">
                  Advance Payment (if any) ₹
                </span>
                <input
                  type="number"
                  {...register("advancePayment", { valueAsNumber: true })}
                  className="w-32 px-3 py-1 border rounded-lg text-right focus:ring-2 focus:ring-primary/50"
                />
              </div>

              <div className="flex justify-between items-center px-4 py-3 bg-rose-50 rounded-xl border border-rose-200 shadow-sm">
                <span className="font-bold text-rose-800 text-lg">
                  Remaining Balance
                </span>
                <span className="font-bold text-rose-800 text-xl">
                  ₹ {remainingAmount.toFixed(2)}
                </span>
              </div>
            </div>
          </div>

          <div className="pt-6 border-t border-slate-200 flex justify-end">
            <button
              onClick={
                isSaved ? () => setShowPrintModal(true) : handleSubmit(onSubmit)
              }
              disabled={isSaving || isLoadingExisting || isGeneratingPdf}
              className="w-full sm:w-auto bg-primary text-white px-10 py-4 rounded-xl font-bold hover:bg-green-700 transition-all flex items-center justify-center gap-3 disabled:opacity-50 cursor-pointer hover:-translate-y-0.5 active:translate-y-0 hover:shadow-md text-xl shadow-sm"
            >
              {isSaving || isLoadingExisting || isGeneratingPdf ? (
                <>
                  <RefreshCw size={24} className="animate-spin" />{" "}
                  {isGeneratingPdf
                    ? "Generating PDF..."
                    : isLoadingExisting
                      ? "Loading..."
                      : "Saving..."}
                </>
              ) : isSaved ? (
                <>
                  <Printer size={24} /> Print Options
                </>
              ) : (
                <>
                  <Save size={24} /> Save & Print Receipt
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* --- PRINT ONLY UI (Mirrors the receipt image) --- */}
      <ReceiptPrint
        booking={{
          ...watch(),
          roomsBooked: (watch("roomsBooked") || []).map((id: any) => {
            const found = availableRooms.find((r) => r._id === id);
            return found ? found : id;
          }),
          particulars: calculatedParticulars,
          subTotal,
          totalAmount,
          advancePayment: watchAdvancePayment,
          remainingAmount,
          amountInWords,
        }}
      />

      {/* Print Modal */}
      {showPrintModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 print:hidden">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm overflow-hidden border border-slate-200 p-6 text-center">
            <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 size={32} />
            </div>
            <h2 className="text-2xl font-bold text-slate-800 mb-2">
              Bill Saved!
            </h2>
            <p className="text-slate-500 mb-6">
              The bill has been securely saved to the database.
            </p>

            <div className="flex flex-col gap-3 w-full">
              <button
                onClick={async () => {
                  setShowPrintModal(false);
                  await handlePrint();
                }}
                className="w-full py-3 px-4 rounded-xl bg-primary text-white font-bold hover:bg-green-700 transition-all cursor-pointer hover:-translate-y-0.5 active:translate-y-0 shadow-sm flex items-center justify-center gap-2"
              >
                <Printer size={20} /> Download PDF Receipt
              </button>
              <button
                onClick={() => setShowPrintModal(false)}
                className="w-full py-3 px-4 rounded-xl border-2 border-slate-200 text-slate-700 font-bold hover:bg-slate-50 transition-all cursor-pointer hover:-translate-y-0.5 active:translate-y-0"
              >
                I'll Print it Later
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
