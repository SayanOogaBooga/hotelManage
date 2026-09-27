"use client";

import { useState } from "react";
import { useForm, useFieldArray, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { numberToWords } from "@/lib/numberToWords";
import { Plus, Trash2, Printer, Save, CheckCircle2 } from "lucide-react";
import { format } from "date-fns";
import { DatePicker } from "@/components/ui/date-picker";
import toast from "react-hot-toast";

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
  particulars: z.array(particularSchema).min(1, "At least one particular is required"),
  gst: z.number().min(0).optional(),
  paymentMode: z.enum(["Cash", "UPI", "Bank Transfer", "Others"]),
});

type FormValues = z.infer<typeof billingSchema>;

export default function BillingPage() {
  const [isSaving, setIsSaving] = useState(false);
  const [isSaved, setIsSaved] = useState(false);

  const { register, control, watch, handleSubmit, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(billingSchema),
    defaultValues: {
      memoNo: "",
      date: new Date().toISOString().split('T')[0],
      guestName: "",
      address: "",
      mobileNo: "",
      checkIn: "",
      checkOut: "",
      particulars: [{ slNo: 1, description: "", noOfHead: 1, ratePerHeadDay: 0 }],
      gst: 0,
      paymentMode: "Cash"
    },
    mode: "onChange"
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "particulars"
  });

  // Watch for dynamic calculation without forcing re-renders via setValue loop
  const watchParticulars = watch("particulars");
  const watchGst = watch("gst") || 0;
  
  // Calculate dynamically during render
  const calculatedParticulars = fields.map((field, index) => {
    const current = watchParticulars?.[index] || field;
    const amount = (current.noOfHead || 0) * (current.ratePerHeadDay || 0);
    return { ...current, amount };
  });

  const subTotal = calculatedParticulars.reduce((sum, item) => sum + item.amount, 0);
  const totalAmount = subTotal + watchGst;
  const amountInWords = numberToWords(totalAmount);

  const onSubmit = async (data: FormValues) => {
    setIsSaving(true);
    try {
      // Map the dynamically calculated amounts back into the payload before sending
      const payloadParticulars = data.particulars.map(p => ({
        ...p,
        amount: p.noOfHead * p.ratePerHeadDay
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
        toast.success("Bill generated successfully!");
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
    <div className="max-w-6xl mx-auto pb-24">
      {/* --- WEB FORM UI (Hidden when printing) --- */}
      <div className="print:hidden space-y-6 md:space-y-8">
        <div className="flex flex-col md:flex-row md:justify-between md:items-end gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-slate-800">Generate Bill / Receipt</h1>
            <p className="text-sm md:text-base text-slate-500 mt-1">Fill the details to auto-calculate amounts and generate a printable receipt.</p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={handleSubmit(onSubmit)}
              disabled={isSaving || isSaved}
              className="w-full sm:w-auto bg-primary text-white px-5 py-2.5 rounded-xl font-medium hover:bg-green-700 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {isSaving ? <span className="animate-pulse">Saving...</span> : isSaved ? <><CheckCircle2 size={18}/> Saved!</> : <><Save size={18} /> Save to DB</>}
            </button>
            <button
              onClick={handlePrint}
              className="w-full sm:w-auto bg-white border border-slate-300 text-slate-700 px-5 py-2.5 rounded-xl font-medium hover:bg-slate-50 transition-all flex items-center justify-center gap-2 shadow-sm"
            >
              <Printer size={18} /> Print Receipt
            </button>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 md:p-8 space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-1">
              <label className="text-sm font-semibold text-slate-700">Memo No.</label>
              <input {...register("memoNo")} className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary/50 ${errors.memoNo ? 'border-red-500 bg-red-50' : 'border-slate-200'}`} />
              {errors.memoNo && <p className="text-red-500 text-xs mt-1">{errors.memoNo.message}</p>}
            </div>
            
            <div className="space-y-1">
              <label className="text-sm font-semibold text-slate-700">Date</label>
              <Controller
                control={control}
                name="date"
                render={({ field }) => (
                  <DatePicker value={field.value} onChange={field.onChange} />
                )}
              />
              {errors.date && <p className="text-red-500 text-xs mt-1">{errors.date.message}</p>}
            </div>

            <div className="space-y-1 md:col-span-2">
              <label className="text-sm font-semibold text-slate-700">Guest Name</label>
              <input {...register("guestName")} className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary/50 ${errors.guestName ? 'border-red-500 bg-red-50' : 'border-slate-200'}`} />
              {errors.guestName && <p className="text-red-500 text-xs mt-1">{errors.guestName.message}</p>}
            </div>

            <div className="space-y-1 md:col-span-2">
              <label className="text-sm font-semibold text-slate-700">Address</label>
              <input {...register("address")} className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-primary/50" />
            </div>

            <div className="space-y-1 md:col-span-2 lg:col-span-1">
              <label className="text-sm font-semibold text-slate-700">Mobile No.</label>
              <input {...register("mobileNo")} className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary/50 ${errors.mobileNo ? 'border-red-500 bg-red-50' : 'border-slate-200'}`} />
              {errors.mobileNo && <p className="text-red-500 text-xs mt-1">{errors.mobileNo.message}</p>}
            </div>

            <div className="space-y-1">
              <label className="text-sm font-semibold text-slate-700">Payment Mode</label>
              <select {...register("paymentMode")} className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-primary/50 bg-white">
                <option value="Cash">Cash</option>
                <option value="UPI">UPI</option>
                <option value="Bank Transfer">Bank Transfer</option>
                <option value="Others">Others</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-sm font-semibold text-slate-700">Check In</label>
              <Controller
                control={control}
                name="checkIn"
                render={({ field }) => (
                  <DatePicker value={field.value} onChange={field.onChange} placeholder="Select check-in date" />
                )}
              />
            </div>

            <div className="space-y-1">
              <label className="text-sm font-semibold text-slate-700">Check Out</label>
              <Controller
                control={control}
                name="checkOut"
                render={({ field }) => (
                  <DatePicker value={field.value} onChange={field.onChange} placeholder="Select check-out date" />
                )}
              />
            </div>
          </div>

          <div className="border-t border-slate-200 pt-8">
            <h3 className="text-lg font-bold text-slate-800 mb-4">Particulars</h3>
            
            <div className="space-y-4">
              {fields.map((field, index) => {
                const particularError = errors.particulars?.[index];
                const dynamicAmount = calculatedParticulars[index]?.amount || 0;
                
                return (
                  <div key={field.id} className={`grid grid-cols-1 md:grid-cols-12 gap-4 items-end bg-slate-50 p-4 md:p-6 rounded-xl border relative group ${particularError ? 'border-red-200' : 'border-slate-100'}`}>
                    <div className="md:col-span-1 space-y-1">
                      <label className="text-xs font-semibold text-slate-500">Sl No.</label>
                      <input type="number" {...register(`particulars.${index}.slNo`, { valueAsNumber: true })} className="w-full px-3 py-2 border rounded-lg bg-white" />
                    </div>
                    <div className="md:col-span-5 space-y-1">
                      <label className="text-xs font-semibold text-slate-500">Particular Description</label>
                      <input {...register(`particulars.${index}.description`)} placeholder="e.g. Room Rent (101)" className={`w-full px-3 py-2 border rounded-lg bg-white ${particularError?.description ? 'border-red-500' : ''}`} />
                    </div>
                    <div className="grid grid-cols-2 gap-4 md:col-span-4">
                      <div className="space-y-1">
                        <label className="text-xs font-semibold text-slate-500">No. of Head/Days</label>
                        <input type="number" {...register(`particulars.${index}.noOfHead`, { valueAsNumber: true })} className={`w-full px-3 py-2 border rounded-lg bg-white ${particularError?.noOfHead ? 'border-red-500' : ''}`} />
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-semibold text-slate-500">Rate (₹)</label>
                        <input type="number" {...register(`particulars.${index}.ratePerHeadDay`, { valueAsNumber: true })} className={`w-full px-3 py-2 border rounded-lg bg-white ${particularError?.ratePerHeadDay ? 'border-red-500' : ''}`} />
                      </div>
                    </div>
                    <div className="md:col-span-2 space-y-1">
                      <label className="text-xs font-semibold text-slate-500">Amount (₹)</label>
                      <div className="w-full px-3 py-2 border border-emerald-200 bg-emerald-50 text-emerald-800 font-bold rounded-lg flex items-center h-[42px]">
                        {dynamicAmount.toFixed(2)}
                      </div>
                    </div>
                    
                    {fields.length > 1 && (
                      <button type="button" onClick={() => remove(index)} className="absolute -right-2 -top-2 md:-right-3 md:-top-3 bg-rose-100 text-rose-600 p-2 rounded-full shadow-sm md:opacity-0 group-hover:opacity-100 transition-opacity z-10 border border-white">
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>
                );
              })}
              {errors.particulars?.root && <p className="text-red-500 text-sm mt-1">{errors.particulars.root.message}</p>}
              
              <button type="button" onClick={() => append({ slNo: fields.length + 1, description: "", noOfHead: 1, ratePerHeadDay: 0 })} className="text-sm font-medium text-primary bg-primary/10 px-4 py-2 rounded-lg hover:bg-primary/20 transition flex items-center gap-2">
                <Plus size={16} /> Add Particular
              </button>
            </div>
          </div>

          <div className="border-t border-slate-200 pt-6 grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="bg-slate-50 p-6 rounded-xl border border-slate-100 flex items-center justify-center text-center">
              <div>
                <p className="text-sm font-medium text-slate-500 mb-1">Amount in Words</p>
                <p className="font-semibold text-slate-800 italic">{amountInWords}</p>
              </div>
            </div>
            
            <div className="space-y-4">
              <div className="flex justify-between items-center px-4 py-2">
                <span className="font-medium text-slate-600">Sub Total</span>
                <span className="font-bold text-slate-800">₹ {subTotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center px-4 py-2 bg-slate-50 rounded-lg">
                <span className="font-medium text-slate-600">GST (if any) ₹</span>
                <input type="number" {...register("gst", { valueAsNumber: true })} className="w-32 px-3 py-1 border rounded-lg text-right focus:ring-2 focus:ring-primary/50" />
              </div>
              <div className="flex justify-between items-center px-4 py-3 bg-emerald-50 rounded-xl border border-emerald-200 shadow-sm">
                <span className="font-bold text-emerald-800 text-lg">Total Amount</span>
                <span className="font-bold text-emerald-800 text-xl">₹ {totalAmount.toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* --- PRINT ONLY UI (Mirrors the receipt image) --- */}
      <div className="hidden print:block w-full text-black font-sans bg-white h-screen">
        <div className="border-2 border-green-800 p-1 relative min-h-[90vh] flex flex-col">
          <div className="border-2 border-green-800 p-4 flex-1 flex flex-col">
            
            {/* Header */}
            <div className="text-center relative mb-4">
              <h1 className="text-5xl font-bold text-blue-900 uppercase font-serif tracking-tighter" style={{ textShadow: "2px 2px 4px rgba(0,0,0,0.2)"}}>Heaven Valley</h1>
              <h2 className="text-3xl font-bold text-green-800 uppercase tracking-widest mt-1">Retreat</h2>
              <p className="text-lg font-semibold text-slate-800">(Kanchanjungha View)</p>
              <p className="italic text-green-700 font-medium mt-1">Feel the Nature ... Feel at Home ...</p>
              
              <div className="absolute top-0 right-0 text-right text-sm">
                <p className="font-bold">📍 Shilarigaon</p>
                <p>Kalimpong District</p>
                <p>West Bengal</p>
                <div className="mt-2 font-bold text-blue-900 leading-tight">
                  <p>📞 7980883751</p>
                  <p>7044083325</p>
                  <p>7439289465</p>
                  <p>9836472445</p>
                </div>
              </div>
            </div>

            <div className="bg-green-100 border border-green-800 text-green-900 text-xs p-2 rounded mb-4 font-medium text-center shadow-inner">
              <span className="font-bold">Nearest Places to Visit :-</span> Lava, Lolegaon, Rishop, Fikkeiegaon, Kafergaon, Daragaon, Ramdhura, Ichhegaon, Pedong, Kalimpong Caktus Garden, Delo, Rishikhola, Aritra, Rongoli, Rongpo, Lingtam, Nathang Valley, Zuluk, Kupup Lake, Old Baba Mandir
            </div>

            <div className="flex justify-center mb-6">
              <div className="bg-green-800 text-white font-bold text-xl px-12 py-1 rounded-full uppercase tracking-widest shadow-md">
                BILL/RECEIPT
              </div>
            </div>

            {/* Meta Info */}
            <div className="flex justify-between font-bold text-blue-900 text-sm mb-4">
              <div>Memo No. : <span className="text-black font-normal border-b border-black inline-block min-w-[150px]">{watch("memoNo")}</span></div>
              <div>Date : <span className="text-black font-normal border-b border-black inline-block min-w-[150px]">{watch("date") ? format(new Date(watch("date") as string), 'dd/MM/yyyy') : ''}</span></div>
            </div>

            {/* Guest Info Box */}
            <div className="border border-green-800 rounded-lg p-3 mb-4 space-y-2 text-sm text-blue-900 font-bold">
              <div className="flex">
                <span className="w-24">Guest Name</span>: <span className="text-black font-normal border-b border-dotted border-black flex-1 ml-2">{watch("guestName")}</span>
              </div>
              <div className="flex">
                <span className="w-24">Address</span>: <span className="text-black font-normal border-b border-dotted border-black flex-1 ml-2">{watch("address")}</span>
              </div>
              <div className="flex">
                <span className="w-24">Mobile No.</span>: <span className="text-black font-normal border-b border-dotted border-black flex-1 ml-2">{watch("mobileNo")}</span>
              </div>
              <div className="flex justify-between pt-1">
                <div className="flex w-1/2 pr-4">
                  <span className="w-24">Check In</span>: <span className="text-black font-normal border-b border-black flex-1 ml-2">{watch("checkIn") ? format(new Date(watch("checkIn") as string), 'dd/MM/yyyy') : ''}</span>
                </div>
                <div className="flex w-1/2 pl-4">
                  <span className="w-24">Check Out</span>: <span className="text-black font-normal border-b border-black flex-1 ml-2">{watch("checkOut") ? format(new Date(watch("checkOut") as string), 'dd/MM/yyyy') : ''}</span>
                </div>
              </div>
            </div>

            {/* Table */}
            <table className="w-full border-collapse border border-green-800 mb-4 text-sm flex-1">
              <thead>
                <tr className="bg-green-100 text-green-900">
                  <th className="border border-green-800 py-2 w-12">Sl. No.</th>
                  <th className="border border-green-800 py-2">Particulars</th>
                  <th className="border border-green-800 py-2 w-24">No of Head</th>
                  <th className="border border-green-800 py-2 w-32">Rate<br/>Per head/Day</th>
                  <th className="border border-green-800 py-2 w-32">Amount (₹)</th>
                </tr>
              </thead>
              <tbody>
                {calculatedParticulars.map((item, idx) => (
                  <tr key={idx} className="text-center h-8 text-black">
                    <td className="border-x border-green-800">{item.slNo || idx + 1}</td>
                    <td className="border-x border-green-800 text-left px-2">{item.description}</td>
                    <td className="border-x border-green-800">{item.noOfHead || ''}</td>
                    <td className="border-x border-green-800">{item.ratePerHeadDay || ''}</td>
                    <td className="border-x border-green-800">{item.amount ? item.amount.toFixed(2) : ''}</td>
                  </tr>
                ))}
                {/* Empty rows to push height */}
                {Array.from({length: Math.max(0, 5 - calculatedParticulars.length)}).map((_, i) => (
                  <tr key={`empty-${i}`} className="h-8">
                    <td className="border-x border-green-800"></td>
                    <td className="border-x border-green-800"></td>
                    <td className="border-x border-green-800"></td>
                    <td className="border-x border-green-800"></td>
                    <td className="border-x border-green-800"></td>
                  </tr>
                ))}
                {/* Footer Rows */}
                <tr className="border-t border-green-800">
                  <td colSpan={3} rowSpan={3} className="border border-green-800"></td>
                  <td className="border border-green-800 text-right px-2 font-bold text-blue-900 bg-green-50">Sub Total</td>
                  <td className="border border-green-800 text-center font-bold">{subTotal ? subTotal.toFixed(2) : ''}</td>
                </tr>
                <tr>
                  <td className="border border-green-800 text-right px-2 font-bold text-blue-900 bg-green-50">GST (if any)</td>
                  <td className="border border-green-800 text-center font-bold">{watchGst ? watchGst.toFixed(2) : ''}</td>
                </tr>
                <tr className="bg-green-800 text-white font-bold">
                  <td className="border border-green-800 text-right px-2 py-1">Total Amount</td>
                  <td className="border border-green-800 text-center">{totalAmount ? totalAmount.toFixed(2) : ''}</td>
                </tr>
              </tbody>
            </table>

            {/* Bottom details */}
            <div className="flex font-bold text-blue-900 text-sm mb-2">
              <span className="w-32">Amount in Words :</span> <span className="text-black font-normal border-b border-dotted border-black flex-1 ml-2 italic text-xs pt-1">{amountInWords}</span>
            </div>
            
            <div className="flex font-bold text-blue-900 text-sm mb-6 items-center">
              <span className="mr-4">Payment Mode :</span>
              <div className="flex items-center mr-4 gap-1"><div className={`w-3 h-3 border border-black ${watch("paymentMode") === 'Cash' ? 'bg-black' : ''}`}></div> <span className="text-black font-normal text-xs">Cash</span></div>
              <div className="flex items-center mr-4 gap-1"><div className={`w-3 h-3 border border-black ${watch("paymentMode") === 'UPI' ? 'bg-black' : ''}`}></div> <span className="text-black font-normal text-xs">UPI</span></div>
              <div className="flex items-center mr-4 gap-1"><div className={`w-3 h-3 border border-black ${watch("paymentMode") === 'Bank Transfer' ? 'bg-black' : ''}`}></div> <span className="text-black font-normal text-xs">Bank Transfer</span></div>
              <div className="flex items-center gap-1"><div className={`w-3 h-3 border border-black ${watch("paymentMode") === 'Others' ? 'bg-black' : ''}`}></div> <span className="text-black font-normal text-xs">Others</span></div>
            </div>

            <div className="flex justify-between items-end mt-auto pt-8">
              <div className="text-green-800 font-serif italic text-lg leading-tight">
                <p className="font-bold text-2xl">Thank You!</p>
                <p>We hope you had a pleasant stay</p>
                <p>with us at Heaven Valley Retreat.</p>
              </div>
              <div className="text-center text-xs font-bold text-blue-900">
                <div className="border-b border-black w-48 mb-1"></div>
                <p>Authorised Signature</p>
                <p>(For Heaven Valley Retreat)</p>
              </div>
            </div>
            
            <div className="text-center mt-6 text-white font-bold italic tracking-wide pb-2 relative z-10" style={{ textShadow: "1px 1px 2px #000"}}>
              Come as a Guest... Leave as a Friend...
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
