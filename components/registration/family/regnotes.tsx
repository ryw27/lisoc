"use client";

import { useEffect, useState } from 'react';

export default function RegNotes({
    notes,
}: {
    notes: string;
}) {
    const [isClient, setIsClient] = useState(false)
 
    useEffect(() => {
        setIsClient(true)
    }, [])    
    

    return (
      <div>
        {notes && isClient && (
           <iframe
                srcDoc={notes}
                style={{ width: "100%", height: "600px", border: "solid black" }}
                title="School Policy"
            />  
        )}
      </div>
    );

}
