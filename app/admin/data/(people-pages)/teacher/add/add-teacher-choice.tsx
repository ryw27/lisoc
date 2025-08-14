"use client";
import { Button } from "@/components/ui/button";
// import { createTeacherRegistrationLink } from "@/lib/auth/actions/createTeacherRegistrationLink";
import { FormSections } from "@/lib/data-view/types";
import { useState } from "react";
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter } from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import AddEntity from "@/components/data-view/add-entity/add-entity";

export default function AddTeacherChoice({ fields }: { fields: FormSections[] }) {
	const [open, setOpen] = useState(false);
	const [email, setEmail] = useState("");
	const [error, setError] = useState("");

	return (
		<>
            <div className="flex flex-col items-center h-screen gap-2">
                <Button
                    variant="default"
                    title="Create Teacher Registration Link and allow user to fill in their details"
                    onClick={() => setOpen(true)}
                    disabled={open}
                >
                    Create Teacher Registration Link
                </Button>

                <div className="flex w-1/3 items-center gap-4 my-8">
                    <div className="bg-gray-200 w-1/2" style={{ height: "2px" }}></div>
                    <span className="text-sm text-gray-500 flex items-center">OR</span>
                    <div className="bg-gray-200 w-1/2" style={{ height: "2px" }}></div>
                </div>

                <AddEntity
                    entity="teacher"
                    title="Add a new teacher"
                    description="Fill out the teacher details yourself."
                    fields={fields}
                />

                <AlertDialog open={open} onOpenChange={setOpen}>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle>Create Teacher Registration Link</AlertDialogTitle>
                        </AlertDialogHeader>
                        <AlertDialogDescription>
                            Create a registration link for a new teacher user.
                        </AlertDialogDescription>
                        <Input
                            type="email"
                            placeholder="Email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                        />
                        {error && <p className="text-red-500">{error}</p>}
                        <AlertDialogFooter>
                            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
                            <Button
                                variant="default"
                                onClick={async () => {
                                    const res = await createTeacherRegistrationLink(email);
                                    if (res.ok) {
                                        setOpen(false);
                                    } else {
                                        setError(res.message || "Something went wrong");
                                    }
                                }}
                            >
                                Create Registration Link
                            </Button>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
            </div>
		</>
	);
}