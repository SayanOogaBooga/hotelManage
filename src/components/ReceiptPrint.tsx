import { format } from "date-fns";
import React from "react";

export function ReceiptPrint({ booking }: { booking: any }) {
  if (!booking) return null;

  return (
    <div className="fixed top-[200vh] left-0 w-[800px] bg-white -z-50 pointer-events-none">
      <div id="receipt-print" className="w-full text-black font-sans bg-white overflow-hidden m-0 p-0">
        <div className="border-2 border-green-800 p-1 relative min-h-[1100px] flex flex-col box-border mx-auto bg-white">
        <div className="border-2 border-green-800 p-4 flex-1 flex flex-col">
          {/* Header */}
          <div className="text-center relative mb-4">
            <h1
              className="text-5xl font-bold text-blue-900 uppercase font-serif tracking-tighter"
              style={{ textShadow: "2px 2px 4px rgba(0,0,0,0.2)" }}
            >
              Heaven Valley
            </h1>
            <h2 className="text-3xl font-bold text-green-800 uppercase tracking-widest mt-1">
              Retreat
            </h2>
            <p className="text-lg font-semibold text-slate-800">
              (Kanchanjungha View)
            </p>
            <p className="italic text-green-700 font-medium mt-1">
              Feel the Nature ... Feel at Home ...
            </p>

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
            <span className="font-bold">Nearest Places to Visit :-</span>{" "}
            Lava, Lolegaon, Rishop, Fikkeiegaon, Kafergaon, Daragaon,
            Ramdhura, Ichhegaon, Pedong, Kalimpong Caktus Garden, Delo,
            Rishikhola, Aritra, Rongoli, Rongpo, Lingtam, Nathang Valley,
            Zuluk, Kupup Lake, Old Baba Mandir
          </div>

          <div className="flex justify-center mb-6">
            <div className="bg-green-800 text-white font-bold text-xl px-12 py-1 rounded-full uppercase tracking-widest shadow-md">
              BILL/RECEIPT
            </div>
          </div>

          {/* Meta Info */}
          <div className="flex justify-between font-bold text-blue-900 text-sm mb-4">
            <div>
              Memo No. :{" "}
              <span className="text-black font-normal border-b border-black inline-block min-w-[150px]">
                {booking.memoNo}
              </span>
            </div>
            <div>
              Date :{" "}
              <span className="text-black font-normal border-b border-black inline-block min-w-[150px]">
                {booking.date
                  ? format(new Date(booking.date as string), "dd/MM/yyyy")
                  : ""}
              </span>
            </div>
          </div>

          {/* Guest Info Box */}
          <div className="border border-green-800 rounded-lg p-3 mb-4 space-y-2 text-sm text-blue-900 font-bold">
            <div className="flex">
              <span className="w-24">Guest Name</span>:{" "}
              <span className="text-black font-normal border-b border-dotted border-black flex-1 ml-2">
                {booking.guestName}
              </span>
            </div>
            <div className="flex">
              <span className="w-24">Address</span>:{" "}
              <span className="text-black font-normal border-b border-dotted border-black flex-1 ml-2">
                {booking.address}
              </span>
            </div>
            <div className="flex">
              <span className="w-24">Mobile No.</span>:{" "}
              <span className="text-black font-normal border-b border-dotted border-black flex-1 ml-2">
                {booking.mobileNo}
              </span>
            </div>
            <div className="flex justify-between pt-1">
              <div className="flex w-1/2 pr-4">
                <span className="w-24">Check In</span>:{" "}
                <span className="text-black font-normal border-b border-black flex-1 ml-2">
                  {booking.checkIn
                    ? format(
                        new Date(booking.checkIn as string),
                        "dd/MM/yyyy",
                      )
                    : ""}
                </span>
              </div>
              <div className="flex w-1/2 pl-4">
                <span className="w-24">Check Out</span>:{" "}
                <span className="text-black font-normal border-b border-black flex-1 ml-2">
                  {booking.checkOut
                    ? format(
                        new Date(booking.checkOut as string),
                        "dd/MM/yyyy",
                      )
                    : ""}
                </span>
              </div>
            </div>
          </div>

          {/* Table */}
          <table className="w-full border-collapse border border-green-800 mb-4 text-sm flex-1">
            <thead>
              <tr className="bg-green-100 text-green-900">
                <th className="border border-green-800 py-2 w-12">Sl. No.</th>
                <th className="border border-green-800 py-2">Particulars</th>
                <th className="border border-green-800 py-2 w-24">
                  No of Head
                </th>
                <th className="border border-green-800 py-2 w-32">
                  Rate
                  <br />
                  Per head/Day
                </th>
                <th className="border border-green-800 py-2 w-32">
                  Amount (₹)
                </th>
              </tr>
            </thead>
            <tbody>
              {booking.particulars?.map((item: any, idx: number) => (
                <tr key={idx} className="text-center h-8 text-black">
                  <td className="border-x border-green-800">
                    {item.slNo || idx + 1}
                  </td>
                  <td className="border-x border-green-800 text-left px-2">
                    {item.description}
                  </td>
                  <td className="border-x border-green-800">
                    {item.noOfHead || ""}
                  </td>
                  <td className="border-x border-green-800">
                    {item.ratePerHeadDay || ""}
                  </td>
                  <td className="border-x border-green-800">
                    {item.amount ? item.amount.toFixed(2) : ""}
                  </td>
                </tr>
              ))}
              {/* Empty rows to push height */}
              {Array.from({
                length: Math.max(0, 5 - (booking.particulars?.length || 0)),
              }).map((_, i) => (
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
                <td
                  colSpan={3}
                  rowSpan={3}
                  className="border border-green-800"
                ></td>
                <td className="border border-green-800 text-right px-2 font-bold text-blue-900 bg-green-50">
                  Sub Total
                </td>
                <td className="border border-green-800 text-center font-bold">
                  {booking.subTotal ? booking.subTotal.toFixed(2) : ""}
                </td>
              </tr>
              <tr>
                <td className="border border-green-800 text-right px-2 font-bold text-blue-900 bg-green-50">
                  GST (if any)
                </td>
                <td className="border border-green-800 text-center font-bold">
                  {booking.gst ? booking.gst.toFixed(2) : ""}
                </td>
              </tr>
              <tr className="bg-green-800 text-white font-bold">
                <td className="border border-green-800 text-right px-2 py-1">
                  Total Amount
                </td>
                <td className="border border-green-800 text-center">
                  {booking.totalAmount ? booking.totalAmount.toFixed(2) : ""}
                </td>
              </tr>
            </tbody>
          </table>

          {/* Bottom details */}
          <div className="flex font-bold text-blue-900 text-sm mb-2">
            <span className="w-32">Amount in Words :</span>{" "}
            <span className="text-black font-normal border-b border-dotted border-black flex-1 ml-2 italic text-xs pt-1">
              {booking.amountInWords}
            </span>
          </div>

          <div className="flex font-bold text-blue-900 text-sm mb-6 items-center">
            <span className="mr-4">Payment Mode :</span>
            <div className="flex items-center mr-4 gap-1">
              <div
                className={`w-3 h-3 border border-black ${booking.paymentMode === "Cash" ? "bg-black" : ""}`}
              ></div>{" "}
              <span className="text-black font-normal text-xs">Cash</span>
            </div>
            <div className="flex items-center mr-4 gap-1">
              <div
                className={`w-3 h-3 border border-black ${booking.paymentMode === "UPI" ? "bg-black" : ""}`}
              ></div>{" "}
              <span className="text-black font-normal text-xs">UPI</span>
            </div>
            <div className="flex items-center mr-4 gap-1">
              <div
                className={`w-3 h-3 border border-black ${booking.paymentMode === "Bank Transfer" ? "bg-black" : ""}`}
              ></div>{" "}
              <span className="text-black font-normal text-xs">
                Bank Transfer
              </span>
            </div>
            <div className="flex items-center gap-1">
              <div
                className={`w-3 h-3 border border-black ${booking.paymentMode === "Others" ? "bg-black" : ""}`}
              ></div>{" "}
              <span className="text-black font-normal text-xs">Others</span>
            </div>
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

          <div
            className="text-center mt-6 text-white font-bold italic tracking-wide pb-2 relative z-10"
            style={{ textShadow: "1px 1px 2px #000" }}
          >
            Come as a Guest... Leave as a Friend...
          </div>
        </div>
      </div>
      </div>
    </div>
  );
}
