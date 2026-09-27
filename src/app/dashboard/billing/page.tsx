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
  particulars: z
    .array(particularSchema)
    .min(1, "At least one particular is required"),
  gst: z.number().min(0).optional(),
  paymentMode: z.enum(["Cash", "UPI", "Bank Transfer", "Others"]),
});

type FormValues = z.infer<typeof billingSchema>;

export default function BillingPage() {
  const [isSaving, setIsSaving] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [showPrintModal, setShowPrintModal] = useState(false);
  const [isLoadingExisting, setIsLoadingExisting] = useState(false);

  const {
    register,
    control,
    watch,
    handleSubmit,
    reset,
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
      particulars: [
        { slNo: 1, description: "", noOfHead: 1, ratePerHeadDay: 0 },
      ],
      gst: 0,
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
              date: data.date
                ? new Date(data.date).toISOString().split("T")[0]
                : "",
              checkIn: data.checkIn
                ? new Date(data.checkIn).toISOString().split("T")[0]
                : "",
              checkOut: data.checkOut
                ? new Date(data.checkOut).toISOString().split("T")[0]
                : "",
            });
            setIsSaved(true);
          }
        })
        .finally(() => setIsLoadingExisting(false));
    }
  }, [reset]);

  // Watch for dynamic calculation without forcing re-renders via setValue loop
  const watchParticulars = watch("particulars");
  const watchGst = watch("gst") || 0;
  const watchCheckIn = watch("checkIn");

  // Calculate dynamically during render
  const calculatedParticulars = fields.map((field, index) => {
    const current = watchParticulars?.[index] || field;
    const amount = (current.noOfHead || 0) * (current.ratePerHeadDay || 0);
    return { ...current, amount };
  });

  const subTotal = calculatedParticulars.reduce(
    (sum, item) => sum + item.amount,
    0,
  );
  const totalAmount = subTotal + watchGst;
  const amountInWords = numberToWords(totalAmount);

  const onSubmit = async (data: FormValues) => {
    setIsSaving(true);
    try {
      // Map the dynamically calculated amounts back into the payload before sending
      const payloadParticulars = data.particulars.map((p) => ({
        ...p,
        amount: p.noOfHead * p.ratePerHeadDay,
      }));

      const payload = {
        ...data,
        particulars: payloadParticulars,
        subTotal,
        totalAmount,
        amountInWords,
        date: new Date(data.date),
        checkIn: data.checkIn ? new Date(data.checkIn) : null,
        checkOut: data.checkOut ? new Date(data.checkOut) : null,
      };

      const res = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        setIsSaved(true);
        playSuccessSound();
        toast.success("Bill saved successfully!");
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

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="max-w-6xl mx-auto pb-24 print:pb-0 print:m-0 print:max-w-none">
      {/* --- WEB FORM UI (Hidden when printing) --- */}
      <div className="print:hidden space-y-6 md:space-y-8">
        <div className="flex flex-col gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-slate-800">
              Generate Bill / Receipt
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
                {...register("memoNo")}
                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary/50 ${errors.memoNo ? "border-red-500 bg-red-50" : "border-slate-200"}`}
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

            <div className="space-y-1 col-span-2">
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
                Mobile No.
              </label>
              <input
                {...register("mobileNo")}
                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary/50 ${errors.mobileNo ? "border-red-500 bg-red-50" : "border-slate-200"}`}
              />
              {errors.mobileNo && (
                <p className="text-red-500 text-xs mt-1">
                  {errors.mobileNo.message}
                </p>
              )}
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
                    onChange={field.onChange}
                    placeholder="Check-in date"
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
                    onChange={field.onChange}
                    placeholder="Check-out date"
                    minDate={watchCheckIn}
                  />
                )}
              />
            </div>
          </div>

          <div className="border-t border-slate-200 pt-8">
            <h3 className="text-lg font-bold text-slate-800 mb-4">
              Particulars
            </h3>

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
                          No. of Head/Days
                        </label>
                        <input
                          type="number"
                          {...register(`particulars.${index}.noOfHead`, {
                            valueAsNumber: true,
                          })}
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
                          className={`w-full px-3 py-2 border rounded-lg bg-white ${particularError?.ratePerHeadDay ? "border-red-500" : ""}`}
                        />
                      </div>
                    </div>
                    <div className="md:col-span-2 space-y-1">
                      <label className="text-xs font-semibold text-slate-500">
                        Amount (₹)
                      </label>
                      <div className="w-full px-3 py-2 border border-emerald-200 bg-emerald-50 text-emerald-800 font-bold rounded-lg flex items-center h-[42px]">
                        {dynamicAmount.toFixed(2)}
                      </div>
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
              <div className="flex justify-between items-center px-4 py-2 bg-slate-50 rounded-lg">
                <span className="font-medium text-slate-600">
                  GST (if any) ₹
                </span>
                <input
                  type="number"
                  {...register("gst", { valueAsNumber: true })}
                  className="w-32 px-3 py-1 border rounded-lg text-right focus:ring-2 focus:ring-primary/50"
                />
              </div>
              <div className="flex justify-between items-center px-4 py-3 bg-emerald-50 rounded-xl border border-emerald-200 shadow-sm">
                <span className="font-bold text-emerald-800 text-lg">
                  Total Amount
                </span>
                <span className="font-bold text-emerald-800 text-xl">
                  ₹ {totalAmount.toFixed(2)}
                </span>
              </div>
            </div>
          </div>
          
          <div className="pt-6 border-t border-slate-200 flex justify-end">
            <button
              onClick={
                isSaved ? () => setShowPrintModal(true) : handleSubmit(onSubmit)
              }
              disabled={isSaving || isLoadingExisting}
              className="w-full sm:w-auto bg-primary text-white px-10 py-4 rounded-xl font-bold hover:bg-green-700 transition-all flex items-center justify-center gap-3 disabled:opacity-50 cursor-pointer hover:-translate-y-0.5 active:translate-y-0 hover:shadow-md text-xl shadow-sm"
            >
              {isSaving || isLoadingExisting ? (
                <>
                  <RefreshCw size={24} className="animate-spin" />{" "}
                  {isLoadingExisting ? "Loading..." : "Saving..."}
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
          particulars: calculatedParticulars,
          subTotal,
          totalAmount,
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
                onClick={() => {
                  setShowPrintModal(false);
                  setTimeout(() => window.print(), 100);
                }}
                className="w-full py-3 px-4 rounded-xl bg-primary text-white font-bold hover:bg-green-700 transition-all cursor-pointer hover:-translate-y-0.5 active:translate-y-0 shadow-sm flex items-center justify-center gap-2"
              >
                <Printer size={20} /> Print Bill Now
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
