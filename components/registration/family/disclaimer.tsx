"use client";

import { useState } from "react";

export default function DisclaimerPage({
    handleDisclaimerChange,
}: {
    handleDisclaimerChange: (agreed: boolean) => void;
}) {
    const [checked, setChecked] = useState<boolean>(false);
    return (
        <div>
            <h1
                style={{
                    textAlign: "left",
                    fontWeight: "bold",
                    fontSize: "2rem",
                    marginBottom: "1rem",
                    color: "red",
                }}
            >
                请仔细阅读本校的注册规定。您必须同意此规定才可以继续注册。
                <br />
                Please read the school policy carefully. You need to agree with all terms and rules
                before you can continue your registration.
                <br />
                <br />
            </h1>
            <iframe
                src="/SchoolPolicy.htm"
                style={{ width: "100%", height: "600px", border: "solid black" }}
                title="School Policy"
            />
            <div>
                <label style={{ fontSize: "1.25rem", fontWeight: "bold" }}>
                    <input
                        type="checkbox"
                        checked={checked}
                        onChange={(e) => setChecked(e.target.checked)}
                        style={{ marginRight: "0.5rem", color: "red" }}
                    />
                    我已经阅读并同意学校的注册规定。I have read and agreed with all terms and rules
                    of the school policy
                </label>
            </div>
            <button
                onClick={() => handleDisclaimerChange(true)}
                disabled={!checked}
                style={{
                    padding: "1rem 2rem",
                    fontSize: "1.25rem",
                    fontWeight: "bold",
                    marginTop: "1.5rem",
                    backgroundColor: "#2185f0ff",
                    color: checked ? "white" : "darkgray",
                    border: "none",
                    borderRadius: "0.5rem",
                    cursor: "pointer",
                    display: "block",
                }}
            >
                Proceed to Registration/继续注册
            </button>
        </div>
    );
}
