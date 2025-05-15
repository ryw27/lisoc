import { ColumnDef } from "@tanstack/react-table";
import { arrangement, family, familybalance, feedback, seasons, student, teacher } from "@/app/lib/db/schema";
import { generateColumnDefs } from "@/app/lib/data-actions";

//Helper function to format date
export function formatDate(date: Date) {
    // Format as YYYY-MM-DD to ensure consistency between server and client
    if (!date) return "";
    try {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    } catch (error) {
        return "Invalid date";
    }
}
//Filter types
export type filterTypes = 
    | {type: 'text'; mode: ['=']}
    | {type: 'enum'; mode: ['=', '≠'], options: readonly string[]}
    | {type: 'number'; mode: ['=', '≠', '>', '<', '>=', '<=', 'between']}
    | {type: 'date'; mode: ['in the last', '=', 'between', '>=', '<='], options: ['hours', 'days', 'months', 'years']}

export interface ColumnMetaFilter {
    filter?: filterTypes;
}

export type FilterableColumn<TData> =
  ColumnDef<TData, unknown>   // TanStack's generic column
  & { id: string           // force this to exist
      meta: ColumnMetaFilter,  
}


//----------------------------------------------------------------------------------------
// ARRANGEMENT
//----------------------------------------------------------------------------------------


export type arrangement = typeof arrangement.$inferSelect;
export const arrangementColumns = generateColumnDefs<arrangement>(arrangement, {
    arrangeid: {
        header: "Arrange ID",
    },
    seasonid: {
        header: "Season ID",
    },
    classid: {
        header: "Class ID",
    },
    teacherid: {
        header: "Teacher ID",
    },
    roomid: {
        header: "Room ID",
    },
	seatlimit: {
        header: "Seat Limit",
    },
	agelimit: {
        header: "Age Limit",
    },
	suitableterm: {
        header: "Suitable Term",
    },
	waiveregfee: {
        header: "Waive Reg Fee",
    },
	activestatus: {
        header: "Active Status",
    },
	regstatus: {
        header: "Reg Status",
    },
	closeregistration: {
        header: "Close Registration",
    },
	notes: {
        header: "Notes",
    },
	lastmodify: {
        header: "Last Modify",
    },
	updateby: {
        header: "Update By",
    },
	tuitionW: {
        header: "Tuition W",
    },
	specialfeeW: {
        header: "Special Fee W",
    },
	tuitionH: {
        header: "Tuition H",
    },
	specialfeeH: {
        header: "Special Fee H",
    },
})



//----------------------------------------------------------------------------------------
// FAMILY 
//----------------------------------------------------------------------------------------

export type Family = typeof family.$inferSelect;
export const familyColumns = generateColumnDefs<Family>(family, {
    familyid: {
        header: "Family ID",
    },
    username: {
        header: "Username",
    },
    password: {
        header: "Password",
    },
    fatherfirsten: {
        header: "Father First Name (EN)",
    },
    fatherlasten: {
        header: "Father Last Name (EN)",
    },
    fathernamecn: {
        header: "Father Name (CN)",
    },
    motherfirsten: {
        header: "Mother First Name (EN)",
    },
    motherlasten: {
        header: "Mother Last Name (EN)",
    },
    mothernamecn: {
        header: "Mother Name (CN)",
    },
    contact: {
        header: "Contact",
    },
    address: {
        header: "Address",
    },
    address1: {
        header: "Address 1",
    },
    city: { 
        header: "City",
    },
    state: {
        header: "State",
    },
    zip: {
        header: "Zip",
    },
    phone: {
        header: "Phone",
    },
    officephone: {
        header: "Office Phone",
    },
    cellphone: {
        header: "Cell Phone",
    },
    email: {
        header: "Email",
    },
    email2: {
        header: "Email 2",
    },
    createddate: {
        header: "Created Date",
    },
    lastmodify: {
        header: "Last Modify",
    },
    lastlogin: {
        header: "Last Login",
    },
    status: {
        header: "Status",
    },
    remark: {
        header: "Remark",
    },
    schoolmember: {
        header: "School Member",
    },
});


//----------------------------------------------------------------------------------------
// FAMILY BALANCE
//----------------------------------------------------------------------------------------

export type FamilyBalance = typeof familybalance.$inferSelect;
export const familyBalanceColumns = generateColumnDefs<FamilyBalance>(familybalance, {
    balanceid: {
        header: "Balance ID",
    },
    appliedid: {
        header: "Applied ID",
    },
    appliedregid: {
        header: "Applied Reg ID",
    },
    seasonid: {
        header: "Season ID",
    },
    familyid: {
        header: "Family ID",
    },
    yearclass: {
        header: "Year Class",
    },
    yearclass4Child: {
        header: "Year Class 4 Child",
    },
    semesterclass: {
        header: "Semester Class",
    },
    semesterclass4Child: {
        header: "Semester Class 4 Child",
    },
    childnum: {
        header: "Child Number",
    },
    childnumRegfee: {
        header: "Child Number Reg Fee",
    },
    studentnum: {
        header: "Student Number",
    },
    lateregfee: {
        header: "Late Reg Fee",
    },
    extrafee4Newfamily: {
        header: "Extra Fee 4 New Family",
    },
    managementfee: {
        header: "Management Fee",
    },
    dutyfee: {
        header: "Duty Fee",
    },
    cleaningfee: {
        header: "Cleaning Fee",
    },
    otherfee: {
        header: "Other Fee",
    },
    tuition: {
        header: "Tuition",
    },
    totalamount: {
        header: "Total Amount",
    },
    typeid: {
        header: "Type ID",
    },
    statusid: {
        header: "Status ID",
    },
    checkno: {
        header: "Check No",
    },
    transactionno: {
        header: "Transaction No",
    },
    isonlinepayment: {
        header: "Is Online Payment",
    },
    registerdate: {
        header: "Register Date",
    },
    lastmodify: {
        header: "Last Modify",
    },
    paiddate: {
        header: "Paid Date",
    },
    reference: {
        header: "Reference",
    },
    notes: {
        header: "Notes",
    },
    processfee: {
        header: "Process Fee",
    },
});

//----------------------------------------------------------------------------------------
// FEEDBACK
//----------------------------------------------------------------------------------------

export type Feedback = typeof feedback.$inferSelect;
export const feedbackColumns = generateColumnDefs<Feedback>(feedback, {
    recid: {
        header: "Rec ID",
    },
    familyid: {
        header: "Family ID",
    },
    name: {
        header: "Name",
    },
    phone: {
        header: "Phone",
    },
    email: {
        header: "Email",
    },
    comment: {
        header: "Comment",
    },
    postdate: {
        header: "Post Date",
    },
    followup: {
        header: "Follow Up",
    },
});


//----------------------------------------------------------------------------------------
// SEASON
//----------------------------------------------------------------------------------------

export type Season = typeof seasons.$inferSelect;
export const seasonColumns = generateColumnDefs<Season>(seasons, {
    seasonid: {
        header: "Season ID",
    },
    seasonnamecn: {
        header: "Season Name (CN)",
    },
	seasonnameeng: {
        header: "Season Name (EN)",
    },
	isspring: {
        header: "Is Spring",
    },
	relatedseasonid: {
        header: "Related Season ID",
    },
	beginseasonid: {
        header: "Begin Season ID",
    },
	haslateregfee: {
        header: "Has Late Reg Fee",
    },
	haslateregfee4Newfamily: {
        header: "Has Late Reg Fee for New Family",
    },
	hasdutyfee: {
        header: "Has Duty Fee",
    },
	startdate: {
        header: "Start Date",
    },
	enddate: {
        header: "End Date",
    },
	earlyregdate: {
        header: "Early Reg Date",
    },
	normalregdate: {
        header: "Normal Reg Date",
    },
	lateregdate1: {
        header: "Late Reg Date 1",
    },
	lateregdate2: {
        header: "Late Reg Date 2",
    },
	closeregdate: {
        header: "Close Reg Date",
    },
	canceldeadline: {
        header: "Cancel Deadline",
    },
	hasdeadline: {
        header: "Has Deadline",
    },
	status: {
        header: "Status",
    },
	open4Register: {
        header: "Open for Register",
    },
	showadmissionnotice: {
        header: "Show Admission Notice",
    },
	showteachername: {
        header: "Show Teacher Name",
    },
	days4Showteachername: {
        header: "Days to Show Teacher Name",
    },
	allownewfamilytoregister: {
        header: "Allow New Family to Register",
    },
	date4Newfamilytoregister: {
        header: "Date for New Family to Register",
    },
	notes: {
        header: "Notes",
    },
	createddate: {
        header: "Created Date",
    },
	lastmodifieddate: {
        header: "Last Modified Date",
    },
	updateby: {
        header: "Update By",
    },
});

//----------------------------------------------------------------------------------------
// STUDENT
//----------------------------------------------------------------------------------------

export type Student = typeof student.$inferSelect;
export const studentColumns = generateColumnDefs<Student>(student, {
    studentid: {
        header: "Student ID",
    },
    familyid: {
        header: "Family ID",
    },
    studentno: {
        header: "Student No",
    },
    namecn: {
        header: "Name (CN)",
    },
    namelasten: {
        header: "Name (Last EN)",
    },
    namefirsten: {
        header: "Name (First EN)",
    },
    gender: {
        header: "Gender",
    },
    ageof: {
        header: "Age of",
    },
	age: {
        header: "Age",
    },
	dob: {
        header: "DOB",
    },
	createddate: {
        header: "Created Date",
    },
	lastmodify: {
        header: "Last Modify",
    },
	notes: {
        header: "Notes",
    },
	upgradable: {
        header: "Upgradable",
    },
});

//----------------------------------------------------------------------------------------
// TEACHER 
//----------------------------------------------------------------------------------------

export type Teacher = typeof teacher.$inferSelect;
export const teacherColumns = generateColumnDefs<Teacher>(teacher, {
    teacherid: {
        header: "Teacher ID",
    },
	namecn: {
        header: "Name (CN)",
    },
	username: {
        header: "Username",
    },
	password: {
        header: "Password",
    },
	namelasten: {
        header: "Name (Last EN)",
    },
	namefirsten: {
        header: "Name (First EN)",
    },
	teacherindex: {
        header: "Teacher Index",
    },
	classtypeid: {
        header: "Class Type ID",
    },
	status: {
        header: "Status",
    },
	ischangepwdnext: {
        header: "Is Change Pwd Next",
    },
	address: {
        header: "Address",
    },
	address1: {
        header: "Address 1",
    },
	city: {
        header: "City",
    },
	state: {
        header: "State",
    },
	zip: {
        header: "Zip",
    },
	phone: {
        header: "Phone",
    },
	email: {
        header: "Email",
    },
	subject: {
        header: "Subject",
    },
	profile: {
        header: "Profile",
    },
	updateby: {
        header: "Update By",
    },
	updateon: {
        header: "Update On",
    },
	lastlogin: {
        header: "Last Login",
    },
});