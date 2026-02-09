"use client";

import { useCallback, useEffect, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import {
    CreateOrderActions,
    CreateOrderData,
    OnApproveActions,
    OnApproveData,
} from "@paypal/paypal-js";
import { FUNDING, PayPalButtons, PayPalScriptProvider } from "@paypal/react-paypal-js";
import { InferSelectModel } from "drizzle-orm";
import { Controller, useForm } from "react-hook-form";
import { z } from "zod/v4";
import { arrangement, classregistration, family, regchangerequest, student } from "@/lib/db/schema";
import { type threeSeasons } from "@/types/seasons.types";
import { type balanceFees, type IdMaps, type uiClasses } from "@/types/shared.types";
import { familyRegister } from "@/server/registration/actions/familyRegister";
import { newRegSchema } from "@/server/registration/schema";
import {
    Select,
    SelectContent,
    SelectGroup,
    SelectItem,
    SelectLabel,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import DisclaimerPage from "./disclaimer";
import RegTable from "./reg-table";

type RegStudentProps = {
    registrations: InferSelectModel<typeof classregistration>[];
    family: InferSelectModel<typeof family>;
    students: InferSelectModel<typeof student>[];
    // registerSpring: boolean
    seasons: threeSeasons;
    threeArrs: {
        year: InferSelectModel<typeof arrangement>[];
        fall: InferSelectModel<typeof arrangement>[];
        spring: InferSelectModel<typeof arrangement>[];
    };
    regchangerequests: InferSelectModel<typeof regchangerequest>[];
    termPrices: {
        yearPrices: balanceFees;
        fallPrices: balanceFees;
        springPrices: balanceFees;
    };
    idMaps: IdMaps;
    // selectOptions: selectOptions;
};

// For reference
const periodMap = {
    1: "1:30 - 3:30",
    2: "1:30 - 4:30",
    3: "3:30 - 4:30",
};

const hasConflict = (current: { first: number; second: number }, period: number) => {
    if (period === 2) return current.first > 0 || current.second > 0;
    if (period === 1) return current.first > 0;
    if (period === 3) return current.second > 0;
    return false;
};

const addPeriod = (current: { first: number; second: number }, period: number) => {
    if (hasConflict(current, period)) return false;
    else if (period === 1) current.first++;
    else if (period === 3) current.second++;
    else if (period === 2) {
        current.first++;
        current.second++;
    }
    return current;
};

const removePeriod = (current: { first: number; second: number }, period: number) => {
    if (period === 1) current.first = Math.max(0, current.first - 1);
    else if (period === 3) current.second = Math.max(0, current.second - 1);
    else if (period === 2) {
        current.first = Math.max(0, current.first - 1);
        current.second = Math.max(0, current.second - 1);
    }
    return current;
};

export default function RegisterStudent({
    registrations,
    family,
    students,
    seasons,
    threeArrs,
    regchangerequests,
    termPrices,
    idMaps,
    // selectOptions
}: RegStudentProps) {
    // Student ID
    const [selectedStudent, setSelectedStudent] = useState<number>(0);
    // Semester ID
    const [selectedSemester, setSelectedSemester] = useState<[number, number, number]>([0, 0, 0]);
    // Class ID
    type classAndTime = { classid: number; timeid: number; contrib: number };
    const [selectedClass, setSelectedClass] = useState<[classAndTime, classAndTime, classAndTime]>([
        { classid: 0, timeid: 0, contrib: 0 },
        { classid: 0, timeid: 0, contrib: 0 },
        { classid: 0, timeid: 0, contrib: 0 },
    ]);
    // Errors
    const [error, setError] = useState<Record<number, [string, string, string]>>(() => {
        const errors = {} as Record<number, [string, string, string]>;
        for (let i = 0; i < students.length; i++) {
            errors[students[i].studentid] = ["", "", ""];
        }
        return errors;
    });

    // Periods to ensure no duplicates
    const [, setPeriods] = useState<Record<number, { first: number; second: number }>>(() => {
        const periods = {} as Record<number, { first: number; second: number }>;
        for (let i = 0; i < students.length; i++) {
            periods[students[i].studentid] = { first: 0, second: 0 };
        }
        return periods;
    });

    // family balance ids extracted from registrations (stored as a Set)
    const [familyBalanceIdSet, setFamilyBalanceIdSet] = useState<Set<number>>(() => new Set());

    // derive family balance ids from registrations prop as a Set
    useEffect(() => {
        const ids = new Set<number>();
        registrations.forEach((r) => {
            if (r.statusid == 1) {
                const v = r.familybalanceid;
                const n = v === undefined || v === null ? 0 : Number(v);
                if (n > 0) ids.add(n);
            }
        });
        setFamilyBalanceIdSet(ids);
    }, [registrations]);

    const getValidClasses = (idx: 0 | 1 | 2) => {
        if (selectedSemester[idx] === 0) {
            const filtered  = [...threeArrs.year, ...threeArrs.fall, ...threeArrs.spring].filter(
                (c) => c.isregclass
            );

            if (filtered.length === 0) {
                // no reg classes found, return all classes
                return [...threeArrs.year, ...threeArrs.fall, ...threeArrs.spring];
            }
            return filtered;

        } else if (selectedSemester[idx] === seasons.year.seasonid) {
            const filtered  = [...threeArrs.year, ...threeArrs.fall, ...threeArrs.spring].filter(
                (c) => c.isregclass
            );

            if (filtered.length === 0) {
                // no reg classes found, return all classes
                return [...threeArrs.year, ...threeArrs.fall, ...threeArrs.spring];
            }
            return filtered;

        } else if (selectedSemester[idx] === seasons.fall.seasonid) {
            const filtered = threeArrs.fall.filter((c) => c.isregclass);
            if (filtered.length === 0) {
                return threeArrs.fall;
            }
            return filtered;
        } else if (selectedSemester[idx] === seasons.spring.seasonid) {
            const filtered = threeArrs.spring.filter((c) => c.isregclass);
            if (filtered.length === 0) {
                return threeArrs.spring;
            }
            return filtered;
        }
        return [];
    };

    const regForm = useForm({
        resolver: zodResolver(newRegSchema),
        defaultValues: {
            studentid: selectedStudent,
            registeredClasses: [{}, {}, {}],
        },
        mode: "onSubmit",
    });

    const resetAll = () => {
        if (selectedStudent) {
            setPeriods((prev) => {
                // TODO: Set it to classregistrations
                return { ...prev, [selectedStudent]: { first: 0, second: 0 } };
            });
            setError((prev) => {
                return { ...prev, [selectedStudent]: ["", "", ""] };
            });
        }
        setSelectedStudent(0);
        regForm.setValue(`studentid`, 0);
        setSelectedSemester([0, 0, 0]);
        setSelectedClass([
            { classid: 0, timeid: 0, contrib: 0 },
            { classid: 0, timeid: 0, contrib: 0 },
            { classid: 0, timeid: 0, contrib: 0 },
        ]);
        [0, 1, 2].map((idx) => {
            regForm.setValue(`registeredClasses.${idx}.seasonid`, undefined);
            regForm.setValue(`registeredClasses.${idx}.arrid`, undefined);
        });
    };

    const resetSelections = (idx: number) => {
        if (selectedStudent !== 0) {
            setPeriods((prev) => {
                const newPeriod = { ...prev[selectedStudent] };
                const periodRemoved = selectedClass[idx].timeid;
                if (periodRemoved === 0) return prev;
                removePeriod(newPeriod, periodRemoved);
                return { ...prev, [selectedStudent]: newPeriod };
            });
            setError((prev) => {
                const newErr = { ...prev };
                if (newErr[selectedStudent]) {
                    newErr[selectedStudent] = [...newErr[selectedStudent]] as [
                        string,
                        string,
                        string,
                    ];
                    newErr[selectedStudent][idx] = ""; // Just clear this specific index
                }
                return newErr;
            });
        }
        setSelectedSemester((prev) => {
            const newSem = [...prev] as [number, number, number];
            newSem[idx] = 0;
            return newSem;
        });
        setSelectedClass((prev) => {
            const newSem = [...prev] as [classAndTime, classAndTime, classAndTime];
            newSem[idx] = { classid: 0, timeid: 0, contrib: 0 };
            return newSem;
        });
        regForm.setValue(`registeredClasses.${idx}.seasonid`, undefined);
        regForm.setValue(`registeredClasses.${idx}.arrid`, undefined);
    };

    const isDisabled =
        Object.values(error).some((x) => x[0] !== "" || x[1] !== "" || x[2] !== "") ||
        selectedStudent === 0 ||
        selectedSemester.every((c) => c === 0) ||
        selectedClass.every((c) => c.classid === 0 || c.timeid === 0) ||
        regForm.formState.isSubmitting;

    const onSubmit = async (formData: z.infer<typeof newRegSchema>) => {
        try {
            // console.log(formData);
            for (let i = 0; i < formData.registeredClasses.length; i++) {
                let classSeason;
                let arrangementData;
                if (formData.registeredClasses[i].seasonid === seasons.year.seasonid) {
                    classSeason = seasons.year;
                    arrangementData = threeArrs.year.find(
                        (c) => c.arrangeid === formData.registeredClasses[i].arrid
                    );
                } else if (formData.registeredClasses[i].seasonid === seasons.fall.seasonid) {
                    classSeason = seasons.fall;
                    arrangementData = threeArrs.fall.find(
                        (c) => c.arrangeid === formData.registeredClasses[i].arrid
                    );
                } else {
                    classSeason = seasons.spring;
                    arrangementData = threeArrs.spring.find(
                        (c) => c.arrangeid === formData.registeredClasses[i].arrid
                    );
                }
                await familyRegister(
                    arrangementData as uiClasses,
                    classSeason,
                    family,
                    formData.studentid
                );
            }
        } catch (err) {
            console.error("Registration submission error: ", err);
        }
    };

    function RegSelect({ idx }: { idx: 0 | 1 | 2 }) {
        return (
            <div className="flex items-center space-x-2">
                <div className="flex flex-col gap-1">
                    <Controller
                        control={regForm.control}
                        name={`registeredClasses.${idx}.seasonid`}
                        render={({ field }) => (
                            <Select
                                value={field.value === 0 ? "" : String(field.value)}
                                onValueChange={(val: string) => {
                                    const seasonId = Number(val);
                                    field.onChange(seasonId);
                                    setSelectedSemester((prev) => {
                                        const newSem = [...prev] as [number, number, number];
                                        newSem[idx] = seasonId;
                                        return newSem;
                                    });
                                }}
                                disabled={selectedStudent === 0}
                            >
                                <SelectTrigger className="w-64">
                                    <SelectValue placeholder="Select a Semester" />
                                </SelectTrigger>
                                <SelectContent className="bg-white">
                                    <SelectItem
                                        key={seasons.year.seasonid}
                                        value={String(seasons.year.seasonid)}
                                    >
                                        {seasons.year.seasonnamecn}
                                    </SelectItem>
                                    <SelectItem
                                        key={seasons.fall.seasonid}
                                        value={String(seasons.fall.seasonid)}
                                    >
                                        {seasons.fall.seasonnamecn}
                                    </SelectItem>
                                    <SelectItem
                                        key={seasons.spring.seasonid}
                                        value={String(seasons.spring.seasonid)}
                                    >
                                        {seasons.spring.seasonnamecn}
                                    </SelectItem>
                                </SelectContent>
                            </Select>
                        )}
                    />
                </div>
                <div className="flex flex-col gap-1">
                    <Controller
                        control={regForm.control}
                        name={`registeredClasses.${idx}.arrid`}
                        render={({ field }) => (
                            <Select
                                value={
                                    selectedClass[idx].classid === 0
                                        ? ""
                                        : `${selectedClass[idx].classid}, ${selectedClass[idx].timeid}`
                                }
                                onValueChange={(val: string) => {
                                    const [arrangeid, timeid] = val.split(", ");

                                    // Check for duplicate class selection
                                    const isDuplicate = selectedClass.some(
                                        (cls, i) => i !== idx && cls.classid === Number(arrangeid)
                                    );

                                    field.onChange(Number(arrangeid));

                                    const oldTime = selectedClass[idx].contrib;
                                    const newTime = Number(timeid);
                                    const classData = {
                                        classid: Number(arrangeid),
                                        timeid: newTime,
                                        contrib: 0,
                                    };
                                    setPeriods((prev) => {
                                        const newPeriod = { ...prev[selectedStudent] }; // Create a copy
                                        if (oldTime !== 0) {
                                            removePeriod(newPeriod, oldTime);
                                        }

                                        if (isDuplicate) {
                                            setError((prevErr) => {
                                                const newErr = { ...prevErr };
                                                newErr[selectedStudent] = [
                                                    ...newErr[selectedStudent],
                                                ] as [string, string, string];
                                                newErr[selectedStudent][idx] =
                                                    "Cannot select the same class multiple times";
                                                return newErr;
                                            });
                                            return { ...prev, [selectedStudent]: newPeriod };
                                        }

                                        // Try to add the new period
                                        if (!addPeriod(newPeriod, newTime)) {
                                            setError((prevErr) => {
                                                const newErr = { ...prevErr };
                                                newErr[selectedStudent] = [
                                                    ...newErr[selectedStudent],
                                                ] as [string, string, string];
                                                newErr[selectedStudent][idx] =
                                                    `Time: ${periodMap[Number(timeid) as 1 | 2 | 3]}, time conflict with other selected classes`;
                                                return newErr;
                                            });
                                            // Keep contrib at 0
                                        } else {
                                            // Clear this index if no conflict
                                            setError((prev) => {
                                                const newErr = { ...prev };
                                                newErr[selectedStudent] = [
                                                    ...newErr[selectedStudent],
                                                ] as [string, string, string];
                                                newErr[selectedStudent][idx] = "";
                                                newErr[selectedStudent] = newErr[
                                                    selectedStudent
                                                ].map((err, i) =>
                                                    i === idx
                                                        ? ""
                                                        : hasConflict(
                                                                newPeriod,
                                                                selectedClass[i].timeid
                                                            )
                                                          ? err
                                                          : ""
                                                ) as [string, string, string];
                                                return newErr;
                                            });
                                            classData.contrib = newTime;
                                        }
                                        // Update selected class state
                                        setSelectedClass((prevClass) => {
                                            const newSem = [...prevClass] as [
                                                classAndTime,
                                                classAndTime,
                                                classAndTime,
                                            ];
                                            newSem[idx] = classData;
                                            return newSem;
                                        });
                                        return { ...prev, [selectedStudent]: newPeriod };
                                    });
                                }}
                                disabled={selectedStudent === 0}
                            >
                                <SelectTrigger className="w-64">
                                    <SelectValue placeholder="Select a Class" />
                                </SelectTrigger>
                                <SelectContent className="bg-white">
                                    {getValidClasses(idx).map((c) => (
                                        <SelectItem
                                            key={c.arrangeid}
                                            value={String(c.arrangeid) + ", " + String(c.timeid)}
                                        >
                                            {idMaps.classMap[c.classid].classnamecn}{" "}
                                            {idMaps.timeMap[c.timeid].period}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        )}
                    />
                </div>
                <button
                    type="button"
                    className="cursor-pointer rounded-md border-2 border-gray-300 p-2 text-xs text-black"
                    onClick={() => resetSelections(idx)}
                >
                    Reset
                </button>
                <div className="ml-2xl items-center">
                    <p className="text-sm text-red-600">
                        {selectedStudent !== 0 ? error[selectedStudent][idx] : ""}
                    </p>
                </div>
            </div>
        );
    }

    const calculateTotal = useCallback(
        (term: "yearPrices" | "fallPrices" | "springPrices") => {
            // TODO: Fix
            const total =
                Number(termPrices[term].childnumRegfee) +
                Number(termPrices[term].regfee) -
                Number(termPrices[term].earlyregdiscount) +
                Number(termPrices[term].lateregfee) +
                Number(termPrices[term].extrafee4newfamily) +
                Number(termPrices[term].managementfee) +
                Number(termPrices[term].dutyfee) +
                Number(termPrices[term].cleaningfee) +
                Number(termPrices[term].otherfee) +
                Number(termPrices[term].tuition);
            return total;
        },
        [termPrices]
    );
    // keep total as a state hook so it can be used elsewhere (e.g. PayPal button)
    const [totalBalance, setTotalBalance] = useState<number>(() => {
        return (
            calculateTotal("yearPrices") +
            calculateTotal("fallPrices") +
            calculateTotal("springPrices")
        );
    });

    // Recompute total when termPrices change
    useEffect(() => {
        const sum =
            calculateTotal("yearPrices") +
            calculateTotal("fallPrices") +
            calculateTotal("springPrices");
        setTotalBalance(sum);
    }, [termPrices, calculateTotal]);

    // PayPal Integration
    const createOrder = (_: CreateOrderData, actions: CreateOrderActions) => {
        const amount = Number(totalBalance || 0).toFixed(2);
        return actions.order.create({
            intent: "CAPTURE",
            purchase_units: [
                {
                    amount: {
                        value: amount,
                        currency_code: "USD",
                    },
                    description: `School Registration`,
                    // include familyBalanceId if available so backend can tie payment to a balance record
                    custom_id: familyBalanceIdSet
                        ? String([...familyBalanceIdSet][0])
                        : "registration",
                },
            ],
        });
    };

    const onApprove = async (_: OnApproveData, actions: OnApproveActions) => {
        //setIsProcessing(true);
        try {
            if (!actions.order) {
                throw new Error("PayPal actions.order is undefined");
            }
            const order = await actions.order.get();
            console.log("Payment successful", order);
            // Extract payer information from PayPal response
            const payerName = order.purchase_units?.[0]?.shipping?.name?.full_name || "";
            const payerEmail = order.purchase_units?.[0]?.payee?.email_address || "";
            const balanceId = order.purchase_units?.[0].custom_id || "";
            const payment_total = order.purchase_units?.[0].amount?.value || "0.00";
            const pdate = order.create_time;

            const paymentData = {
                name: payerName,
                email: payerEmail,
                amount: payment_total,
                orderID: order.id,
                balanceId: balanceId,
                paidDate: pdate,
                familyId: family.familyid,
            };

            console.log("Sending to API:", paymentData);

            // Send payment data to our API
            const response = await fetch("/api/payment", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(paymentData),
            });

            if (!response.ok) {
                const errorText = await response.text();
                console.error("API error response:", errorText);
                throw new Error("Payment processing failed");
            }

            const result = await response.json();
            console.log("API response:", result);
            alert("Payment processed successfully!");
        } catch (error) {
            console.error("Payment failed:", error);
            //setPaypalError('Payment failed. Please try again.');
        } finally {
            //setIsProcessing(false);
            console.log("Payment process completed.");
            window.location.reload();
        }
    };

    const onError = (err: unknown) => {
        console.log("PayPal error:", err);
        //setPaypalError('An error occurred with PayPal. Please try again.');
    };

    const [disclaimerChecked, setDisclaimerChecked] = useState<boolean | null>(null);
    useEffect(() => {
        const agreed = localStorage.getItem("lisoc_disclaimer_agreed");
        setDisclaimerChecked(agreed === "true");
    }, []);

    const handleDisclaimerChange = (checked: boolean) => {
        setDisclaimerChecked(checked);
        localStorage.setItem("lisoc_disclaimer_agreed", checked ? "true" : "false");
    };

    if (disclaimerChecked === null) {
        return <div>Loading...</div>;
    }

    if (disclaimerChecked === false) {
        return <DisclaimerPage handleDisclaimerChange={handleDisclaimerChange} />;
    }

    return (
        <div className="flex flex-col">
            <form onSubmit={regForm.handleSubmit(onSubmit)} className="border-1 border-black p-4">
                <h1 className="flex-col gap-1 text-lg font-bold">注册课程 Register Classes</h1>
                <p className="mt-2">
                    Please choose which student to register first, then choose semester, type of
                    class and finally choose class to register. After the classes are selected, if
                    you want to cancel any one of them, just check Cancel. If you want to cancel a
                    class after you submit the registration, click to cancel that class. After
                    fininshing all registration, please click Print Registration Record button. Some
                    classes might only open for current semester, in this case you should select the
                    semester to register the class. Click here for school registration policy Click
                    here to view the complete list of opened classes. If you have any questions or
                    comment please click here
                    <br />
                    <br />
                    请先选择要注册的学生，然后选择学期、课程类型，最后选择要注册的课程。选择好课程后，如果想取消其中一门课程，
                    只需勾选“取消”。如果在提交注册后想取消某门课程，请点击取消该课程。完成所有注册后，请点击“打印注册记录”按钮。
                    有些课程可能只在当前学期开设，在这种情况下，您应该选择相应的学期来注册该课程。点击此处查看学校注册政策
                    点击此处查看已开设课程的完整列表。
                </p>
                <div className="mt-10 space-y-2">
                    <div className="flex items-center gap-2">
                        <span className="text-black">Select Student:</span>
                        <Controller
                            control={regForm.control}
                            name="studentid"
                            render={({ field }) => (
                                <Select
                                    value={field.value === 0 ? "" : String(field.value)}
                                    onValueChange={(val: string) => {
                                        const numVal = Number(val);
                                        field.onChange(numVal);
                                        setSelectedStudent(numVal);
                                    }}
                                >
                                    <SelectTrigger className="w-64">
                                        <SelectValue placeholder="Select a Student" />
                                    </SelectTrigger>
                                    <SelectContent className="bg-white">
                                        <SelectGroup>
                                            <SelectLabel>Students</SelectLabel>
                                            {students.map((stu) => (
                                                <SelectItem
                                                    key={stu.studentid}
                                                    value={String(stu.studentid)}
                                                >
                                                    {stu.namefirsten} {stu.namelasten}
                                                    {stu.namecn ? ` (${stu.namecn})` : ""}
                                                </SelectItem>
                                            ))}
                                        </SelectGroup>
                                    </SelectContent>
                                </Select>
                            )}
                        />
                    </div>
                    {([0, 1, 2] as const).map((idx) => (
                        <div key={idx} className="flex items-center gap-5">
                            <p>Course {idx + 1} </p>
                            <RegSelect idx={idx} />
                        </div>
                    ))}
                    {regForm.formState.errors.registeredClasses && (
                        <div className="mt-2 text-sm text-red-600">
                            {regForm.formState.errors.registeredClasses.message}
                        </div>
                    )}
                    {regForm.formState.errors.root && (
                        <div className="mt-2 text-sm text-red-600">
                            {regForm.formState.errors.root.message}
                        </div>
                    )}
                    {Array.isArray(regForm.formState.errors.registeredClasses) &&
                        regForm.formState.errors.registeredClasses.map((err, idx) => {
                            if (!err) return null;
                            return (
                                <div key={idx} className="mt-1 text-sm text-red-600">
                                    Course {idx + 1}:{" "}
                                    {err.message || "Please select both semester and class"}
                                </div>
                            );
                        })}
                    <div className="flex justify-end">
                        <div className="flex gap-2">
                            <button
                                type="button"
                                className="rounded-md border-2 border-gray-300 p-2 font-bold text-black"
                                onClick={resetAll}
                            >
                                Reset all
                            </button>
                            <button
                                type="submit"
                                disabled={isDisabled}
                                className={[
                                    "rounded-md p-2 font-bold transition-colors duration-150",
                                    isDisabled
                                        ? "cursor-not-allowed bg-gray-300 text-gray-500"
                                        : "cursor-pointer bg-blue-600 text-white hover:bg-blue-700",
                                ].join(" ")}
                                aria-disabled={isDisabled}
                                tabIndex={isDisabled ? -1 : 0}
                            >
                                Register
                            </button>
                        </div>
                    </div>
                </div>
            </form>
            <div className="mt-5">
                <RegTable
                    registrations={registrations}
                    idMaps={idMaps}
                    students={students}
                    family={family}
                    seasons={seasons}
                    threeArrs={threeArrs}
                    // selectOptions={selectOptions}
                    regchangerequests={regchangerequests}
                />
            </div>
            <div className="mt-5 flex items-center gap-4 self-end">
                <div className="flex flex-col items-end">
                    <p className="font-bold">Total Balance: {totalBalance.toFixed(2)}</p>
                    <p className="text-sm text-gray-600">
                        Family Balance IDs:{" "}
                        {Array.from(familyBalanceIdSet).length > 0
                            ? Array.from(familyBalanceIdSet).join(", ")
                            : ""}
                    </p>
                </div>

                <PayPalScriptProvider
                    options={{
                        clientId: process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID || "",
                        currency: "USD",
                        intent: "capture",
                    }}
                >
                    {totalBalance > 0 ? (
                        <PayPalButtons
                            createOrder={createOrder}
                            onApprove={onApprove}
                            onError={onError}
                            style={{
                                layout: "vertical",
                                shape: "pill",
                                color: "gold",
                                label: "pay",
                                tagline: false,
                            }}
                            fundingSource={FUNDING.PAYPAL}
                        />
                    ) : (
                        <div></div>
                    )}
                </PayPalScriptProvider>
            </div>
        </div>
    );
}
