"use client";

export default function RegNotes({ notes }: { notes: string }) {
    /*    const [isClient, setIsClient] = useState(true)
 
    useEffect(() => {
        setIsClient(true)
    }, [])    
   
*/

    return (
        <div>
            {notes && (
                <iframe
                    srcDoc={notes}
                    style={{ width: "100%", height: "600px", border: "solid black" }}
                    title="School Policy"
                    sandbox="" // This disables all JavaScript
                />
            )}
        </div>
    );
}
