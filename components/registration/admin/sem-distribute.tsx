'use client';

import { adminTransferStudent2 } from "@/server/registration/regchanges/actions/adminTransferStudent";
import { uiClasses, type IdMaps } from "@/types/shared.types";
import { useState } from 'react';
import { type fullRegID } from "./sem-view";

interface Item {
  id: string;
  label: string;
}

export default function BulkTransfer({dataWithStudents, idmaps, onClose,onUpdate}: {dataWithStudents: fullRegID, idmaps: IdMaps, onClose: () => void, onUpdate: (newData: fullRegID) => void}) {
  
  const newData = structuredClone(dataWithStudents); //clone the data to avoid mutating the original
  const classrooms = newData.classrooms;
  const students_in_source = newData.students ;  //regclass[0]
  const numOfDestClasses = classrooms.length ;
  const students_in_dest  = classrooms.map((c) => c.students); //this is an array of arrays, each inner array contains the students in that classroom
 
  const source_items = students_in_source.map((s) => ({
    source: -1 , // -1 indicates source box
    id: s.studentid.toString(),
    label: s.namecn + " (" + s.namelasten + " " + s.namefirsten + ")",
    familyid: s.familyid,
    regid: s.regid,
  }));

  const dest_items = students_in_dest.map((c,index) => (c.map((s) => ({
    source:index,
    id: s.studentid.toString(),
    label: s.namecn + " (" + s.namelasten + " " + s.namefirsten + ")",
    familyid: s.familyid,
    regid: s.regid,
  }))));

  const source_name = idmaps.classMap[newData.arrinfo.classid].classnamecn ;
  const source_limit = newData.arrinfo.seatlimit? newData.arrinfo.seatlimit : 500 ;
  const current_source_count = students_in_source.length ;

  const dest_names = classrooms.map((c) => idmaps.classMap[c.arrinfo.classid].classnamecn) ;

  const dest_limits = classrooms.map((c) => c.arrinfo.seatlimit? c.arrinfo.seatlimit : 500) ;
  const current_dest_counts = students_in_dest.map((c) => c.length) ;



  const [sourceItems, setSourceItems] = useState<Item[]>(source_items);

  const [destinationBoxes, setDestinationBoxes] = useState<Item[][]>(
    Array(numOfDestClasses).fill(null).map((_, i) => dest_items[i] || [])
  );

  const [sourceCount, setSourceCount] = useState(current_source_count);
  const [destCounts, setDestCounts] = useState(current_dest_counts);  


  const [draggedItem, setDraggedItem] = useState<Item | null>(null);

  const handleDragStart = (item: Item) => {
    setDraggedItem(item);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDropToDestBox = (boxIndex: number) => {
    if (draggedItem) {

      const source = draggedItem.source;

      if (source == -1) {
        // If the item is from source, we will remove it from source and add to destination

          setSourceItems((prev) => prev.filter((item) => item.id !== draggedItem.id));
          setSourceCount((prev) => prev - 1);

          setDestinationBoxes((prev) => {
            const updated = [...prev];
            draggedItem.source = boxIndex; // Update source to indicate which destination box it's in
            updated[boxIndex] = [...(updated[boxIndex] || []), draggedItem];
            return updated;
          });
          // update dest count
          setDestCounts((prev) => {
            const updated = [...prev];
            updated[boxIndex] += 1;
            return updated;
        });

      }
      else if (source !== boxIndex) {
        // If the item is from another destination box, we will move it to the new destination box

          setDestinationBoxes((prev) => {
            const updated = [...prev];
            // Remove from old box
            updated[source] = updated[source].filter((item) => item.id !== draggedItem.id);
            // Add to new box
            draggedItem.source = boxIndex; // Update source to indicate which destination box it's in
            updated[boxIndex] = [...(updated[boxIndex] || []), draggedItem];
            return updated;
          });
        setDestCounts((prev) => {
          const updated = [...prev];
          updated[boxIndex] += 1;
          updated[source] -= 1;
          return updated;
      });

        // update newData to reflect the change for database update later
        const studentIndex = newData.classrooms[source].students.findIndex((s) => s.studentid.toString() === draggedItem.id);
        if (studentIndex !== -1) {
          const student = newData.classrooms[source].students[studentIndex];
          // Remove from old destination
          newData.classrooms[source].students.splice(studentIndex, 1);
          // Add to new destination
          newData.classrooms[boxIndex].students.push(student);
        } 

      }
      setDraggedItem(null);
    }
  };

  const handleDropToSource = () => {
    if (draggedItem) {
        const source = draggedItem.source;
        if (source !== -1) {
          // If the item is from a destination box, remove it from that box
          setDestinationBoxes((prev) => {
            const updated = [...prev];
            updated[source] = updated[source].filter((item) => item.id !== draggedItem.id);
            return updated;
          });
          draggedItem.source = -1; // Update source to indicate it's now in the source box
          setSourceItems((prev) => [...prev, draggedItem]);
          setSourceCount((prev) => prev + 1);
          setDestCounts((prev) => {
            const updated = [...prev];
            updated[source] -= 1;
            return updated;
          });
        }
        setDraggedItem(null);
    }
  };

  const handleDistribute = () => {
    if (numOfDestClasses === 0 || sourceItems.length === 0) return;

    const items = [...sourceItems];
    const itemsPerBox = Math.ceil(items.length / numOfDestClasses);
    
    for (let i = 0; i < numOfDestClasses; i++) {
      const start = i * itemsPerBox;
      const end = start + itemsPerBox;
      destinationBoxes[i] = [...destinationBoxes[i], ...(items.slice(start, end))];
    }
    
    setDestinationBoxes(destinationBoxes);
    setSourceItems([]);
    setSourceCount(0);
    setDestCounts(destinationBoxes.map(box => box.length));
  };

  const [showConfirm, setShowConfirm] = useState(false);
  const [isLoading, setIsLoading] = useState(false);


  const confirmUpdate = () => {
    // open confirmation modal instead of rolling back immediately
    setShowConfirm(true);
  };


  const handleRollback = () => {
    const allItems = [
      ...sourceItems,
      ...destinationBoxes.flat(),
    ];
    setSourceItems(allItems);
    setDestinationBoxes(Array(numOfDestClasses).fill(null).map(() => []));
    setSourceCount(allItems.length);
    setDestCounts(Array(numOfDestClasses).fill(0));
  };

  function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

  const performDbUpdate = async   () => {


      // Here you would typically send the updated data to your backend API to update the database. For example:
      try {   
          setIsLoading(true);

          const allStudents = [...dataWithStudents.students, ...dataWithStudents.classrooms.flatMap((c) => c.students)]
          const studentsMap = new Map(allStudents.map((s) => [s.studentid.toString(), s]));

          //  source 
          const oldSourceIds = new Set(dataWithStudents.students.map((c) => c.studentid.toString()));

          const extraInSource = sourceItems.filter((item) => !oldSourceIds.has(item.id.toString()));
      
          let changed = false; // Flag to track if any changes were made
          if (extraInSource.length > 0) 
          {
              changed = true; // Set changed to true if there are any extra items in the source
              for (let item of extraInSource) 
              {
                  const theStudent = studentsMap.get(item.id.toString()); 
                  if (!theStudent) 
                  {
                    console.error(`Student with ID ${item.id} not found in studentsMap.`);
                    continue; // If student not found in the map, skip to the next item
                  }

                  const newArrangeObj: uiClasses & { classkey: number } = {
                        arrangeid: dataWithStudents.arrinfo.arrangeid,  
                        seasonid: dataWithStudents.arrinfo.seasonid,
                        classid:  dataWithStudents.arrinfo.classid,
                        classkey: dataWithStudents.arrinfo.classkey,
                        teacherid: 0,
                        roomid: 0,
                        seatlimit: 0,
                        isregclass: false,
                        tuitionW: null,
                        specialfeeW: null,
                        bookfeeW: null,
                        tuitionH: null,
                        specialfeeH: null,
                        bookfeeH: null,
                        waiveregfee: false,
                        timeid: 0,
                        agelimit: null,
                        suitableterm: 0,
                        closeregistration: false,
                        notes: "",
                      };
                      
                      const newreg = await adminTransferStudent2(theStudent.regid, theStudent.studentid, theStudent.familyid, newArrangeObj);

                      theStudent.regid = newreg.regid; // Update the regid in the studentsMap to reflect the change for the final data update after all moves are done
                      theStudent.registerDate = newreg.registerdate; // Update the registerDate in the studentsMap to reflect the change for the final data update after all moves are done
                      theStudent.notes = newreg.notes || ""; // Update the notes in the studentsMap to reflect the change for the final data update after all moves are done
                      theStudent.classid = newreg.classid; // Update the classid in the studentsMap to reflect the change for the final data update after all moves are done

              }
        }

        for (let i = 0; i < classrooms.length; i++)
        {
              const oldDestIds = new Set(dataWithStudents.classrooms[i].students.map((c) => c.studentid.toString()));

              const extraInDest = destinationBoxes[i].filter((item) => !oldDestIds.has(item.id.toString()));

              if (extraInDest.length > 0)
              {
                changed = true; // Set changed to true if there are any extra items in the destination
                for (let item of extraInDest)
                {
                    const theStudent = studentsMap.get(item.id.toString()); 
                    if (!theStudent) 
                    {
                      console.error(`Student with ID ${item.id} not found in studentsMap.`);
                      continue; // If student not found in the map, skip to the next item
                    }

                    const newArrangeObj: uiClasses & { classkey: number } = {
                            arrangeid: classrooms[i].arrinfo.arrangeid,
                            seasonid: classrooms[i].arrinfo.seasonid,
                            classid:  classrooms[i].arrinfo.classid,
                            classkey: classrooms[i].arrinfo.classkey,
                            teacherid: 0,
                            roomid: 0,
                            seatlimit: 0,
                            isregclass: false,
                            tuitionW: null,
                            specialfeeW: null,
                            bookfeeW: null,
                            tuitionH: null,
                            specialfeeH: null,
                            bookfeeH: null,
                            waiveregfee: false,
                            timeid: 0,
                            agelimit: null,
                            suitableterm: 0,
                            closeregistration: false,
                            notes: "",
                          };
       
                      const newreg = await adminTransferStudent2(theStudent.regid, theStudent.studentid, theStudent.familyid, newArrangeObj);

                      theStudent.regid = newreg.regid; // Update the regid in the studentsMap to reflect the change for the final data update after all moves are done
                      theStudent.registerDate = newreg.registerdate; // Update the registerDate in the studentsMap to reflect the change for the final data update after all moves are done
                      theStudent.notes = newreg.notes || ""; // Update the notes in the studentsMap to reflect the change for the final data update after all moves are done
                      theStudent.classid = newreg.classid; // Update the classid in the studentsMap to reflect the change for the final data update after all moves are done
                }
              }
        }
        if (changed) 
        {
          const modifiedData = structuredClone(dataWithStudents); // Clone the original data to create a new modified data object

          modifiedData.students = allStudents.filter((s) => sourceItems.some((item) => item.id ===  s.studentid.toString()));

          modifiedData.classrooms = modifiedData.classrooms.map((c, index) => ({
                                    ...c,
                                    students: allStudents.filter((s) => {
                                    return destinationBoxes[index].some((item) => item.id === s.studentid.toString());
                                  }),
                   }));



            onUpdate(modifiedData); // Call the onUpdate callback with the new data to update the database
          }
      }
      catch (error) {
        console.error("Error updating database:", error);
        // Handle error, maybe show an error message
      }
      finally {
        setIsLoading(false);
        setShowConfirm(false);
        onClose(); // Close the bulk transfer modal after update

      }
     

  };


  const generateMoved = () => {

    // This function generates the moved data structure based on the current state of sourceItems and destinationBoxes.
    // compared to old data

    const allStudents = [...dataWithStudents.students, ...dataWithStudents.classrooms.flatMap((c) => c.students)]
    const studentsMap = new Map(allStudents.map((s) => [s.studentid.toString(), s]));

    //  source 
    const oldSourceIds = new Set(dataWithStudents.students.map((c) => c.studentid.toString()));
    //const newSourceIds = new Set(sourceItems.map((item) => item.id));

    const extraInSource = sourceItems.filter((item) => !oldSourceIds.has(item.id.toString()));

    let moved = [] ;
    if (extraInSource.length > 0) {
      for (let item of extraInSource) {
        const newArrangeObj: uiClasses & { classkey: number } = {
          arrangeid: dataWithStudents.arrinfo.arrangeid,  
          seasonid: dataWithStudents.arrinfo.seasonid,
          classid:  dataWithStudents.arrinfo.classid,
          classkey: dataWithStudents.arrinfo.classkey,
          teacherid: 0,
          roomid: 0,
          seatlimit: 0,
          isregclass: false,
          tuitionW: null,
          specialfeeW: null,
          bookfeeW: null,
          tuitionH: null,
          specialfeeH: null,
          bookfeeH: null,
          waiveregfee: false,
          timeid: 0,
          agelimit: null,
          suitableterm: 0,
          closeregistration: false,
          notes: "",
        };

        moved.push([item.id, studentsMap.get(item.id.toString())?.familyid, studentsMap.get(item.id.toString())?.regid, newArrangeObj]);
      }
    }

    for (let i = 0; i < classrooms.length; i++) {
      const oldDestIds = new Set(dataWithStudents.classrooms[i].students.map((c) => c.studentid.toString()));
      //const newDestIds = new Set(destinationBoxes[i].map((item) => item.id ));

      const extraInDest = destinationBoxes[i].filter((item) => !oldDestIds.has(item.id.toString()));

      if (extraInDest.length > 0) {
        for (let item of extraInDest) {
          const newArrangeObj: uiClasses & { classkey: number } = {
            arrangeid: classrooms[i].arrinfo.arrangeid,
            seasonid: classrooms[i].arrinfo.seasonid,
            classid:  classrooms[i].arrinfo.classid,
            classkey: classrooms[i].arrinfo.classkey,
            teacherid: 0,
            roomid: 0,
            seatlimit: 0,
            isregclass: false,
            tuitionW: null,
            specialfeeW: null,
            bookfeeW: null,
            tuitionH: null,
            specialfeeH: null,
            bookfeeH: null,
            waiveregfee: false,
            timeid: 0,
            agelimit: null,
            suitableterm: 0,
            closeregistration: false,
            notes: "",
          };
        
          moved.push([item.id, studentsMap.get(item.id.toString())?.familyid, studentsMap.get(item.id.toString())?.regid, newArrangeObj]);
       }
      }
    }
    // temporary log to check the moved data structure

    //console.log("Modified Data for DB Update:", modifiedData);


    return [moved, studentsMap];
  }


  return (
    <div className="p-8">
      <h1 className="text-1XL font-bold mb-2 justify-center text-center">Bulk Transfer (批量转课) </h1>

      {/* Source Box */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-4">{source_name}: {source_limit} / {sourceCount}</h2>
        <div
          onDragOver={handleDragOver}
          onDrop={(e) => {handleDropToSource(); }}
          className="bg-blue-50 border-2 border-blue-300 rounded-lg p-4 h-[200px] overflow-y-auto"
        >
          <div className="grid grid-cols-4 gap-1">
            {sourceItems.map((item) => (
              <div
                key={item.id}
                draggable
                onDragStart={() => handleDragStart(item)}
                className="bg-blue-500 text-white p-2 rounded cursor-move hover:bg-blue-600 transition text-xs"
              >
                {item.label}
              </div>
            ))}
          </div>
          {sourceItems.length === 0 && (
            <p className="text-gray-500">No items in source</p>
          )}
        </div>
      </div>

      {/* Control Buttons */}
      <div className="flex gap-4 mb-8 justify-center">
        <button
          onClick={handleDistribute}
          className="bg-blue-600 text-black px-6 py-2 rounded-lg font-semibold hover:bg-blue-700 transition
                    disabled:bg-gray-400 disabled:text-gray-600 disabled:cursor-not-allowed"
          disabled={sourceItems.length === 0 || numOfDestClasses === 0} >
          Distribute
        </button>
        <button
          onClick={handleRollback}
          className="bg-red-600 text-black px-6 py-2 rounded-lg font-semibold hover:bg-red-700 transition
                    disabled:bg-gray-400 disabled:text-gray-600 disabled:cursor-not-allowed"
          disabled={destinationBoxes.flat().length === 0}
        >
          Rollback
        </button>
      </div>

      {/* Confirmation Modal */}
      {showConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40" onClick={() => setShowConfirm(false)} />
          <div className="relative w-[min(92%,560px)] bg-white rounded-lg shadow-lg px-6 py-6">
            <h3 className="text-xl font-semibold mb-2">Confirm Update</h3>
            <p className="text-sm text-gray-600 mb-6">This will Update Database. Are you sure?</p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowConfirm(false) } 
                className="px-4 py-2 rounded bg-gray-100 hover:bg-gray-200"
              >
                Cancel
              </button>
              <button
                onClick={performDbUpdate}
                className="px-4 py-2 rounded bg-red-600 text-white hover:bg-red-700 disabled:opacity-50"
                disabled={isLoading}
              >
                {isLoading ? 'Updating...' : 'Confirm'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Destination Boxes - Dynamic */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: `repeat(auto-fit, minmax(120px, 1fr))`,
          gap: '2rem',
        }}
      >
        {destinationBoxes.map((items, boxIndex) => {
          const colors = [
            'bg-green-50 border-green-300 bg-green-500',
            'bg-purple-50 border-purple-300 bg-purple-500',
            'bg-pink-50 border-pink-300 bg-pink-500',
            'bg-yellow-50 border-yellow-300 bg-yellow-500',
            'bg-indigo-50 border-indigo-300 bg-indigo-500',
            'bg-cyan-50 border-cyan-300 bg-cyan-500',
            'bg-orange-50 border-orange-300 bg-orange-500',
            'bg-red-50 border-red-300 bg-red-500',
            'bg-teal-50 border-teal-300 bg-teal-500',
            'bg-fuchsia-50 border-fuchsia-300 bg-fuchsia-500',
          ];
          const colorClass = colors[boxIndex % colors.length];
          const [bgClass, borderClass, itemBgClass] = colorClass.split(' ');

          return (
            <div key={boxIndex}>
              <h2 className="text-xl font-semibold mb-4">{dest_names[boxIndex]} {dest_limits[boxIndex]} /{destCounts[boxIndex]}</h2>
              <div
                  onDragOver={handleDragOver}
                  onDrop={() => handleDropToDestBox(boxIndex)}
                  className={`${bgClass} border-2 ${borderClass} rounded-lg p-4 h-[200px] overflow-y-auto`}
                >
                <div className="grid grid-cols-2 gap-1 space-y-2">
                  {items.map((item) => (
                    <div
                      key={item.id}
                      draggable
                      onDragStart={() => handleDragStart(item)}
                      onDragEnd={() => handleDropToSource(boxIndex)}
                      className={`${itemBgClass} text-white p-1 rounded cursor-move hover:opacity-80 transition text-xs`}
                    >
                      {item.label}
                    </div>
                  ))}
                </div>
                {items.length === 0 && (
                  <p className="text-gray-500">Drop items here</p>
                )}
              </div>
            </div>
          );
        })}
      </div>
       <div className="space-y-2 mt-8 text-sm text-gray-500 text-center">
      </div>
        {/* Action Buttons */}

      <div className="flex justify-end mb-8 gap-2 padding-12">

        <button onClick={() => { onClose();  }} className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-red-300">Cancel</button>
        <button onClick={() => {confirmUpdate(); }} className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-blue-300">Update</button>

      </div>  
    </div>
  );
}
