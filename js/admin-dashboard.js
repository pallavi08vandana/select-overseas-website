import {
    collection,
    getDocs,
    doc,
    updateDoc,
    serverTimestamp
} from "https://www.gstatic.com/firebasejs/12.16.0/firebase-firestore.js";

import {
    auth,
    db
} from "./firebase-init.js";

import {
    onAuthStateChanged,
    signOut
} from "https://www.gstatic.com/firebasejs/12.16.0/firebase-auth.js";



/* =========================================================
   GLOBAL VARIABLES
========================================================= */

let allLeads = [];
let selectedLead = null;



/* =========================================================
   ELEMENTS
========================================================= */

const tableBody =
    document.getElementById("leadsTableBody");

const totalLeads =
    document.getElementById("totalLeads");

const newLeads =
    document.getElementById("newLeads");

const contactedLeads =
    document.getElementById("contactedLeads");

const convertedLeads =
    document.getElementById("convertedLeads");

const searchInput =
    document.getElementById("searchInput");

const productFilter =
    document.getElementById("productFilter");

const statusFilter =
    document.getElementById("statusFilter");

const refreshButton =
    document.getElementById("refreshButton");

const modal =
    document.getElementById("leadModal");

const closeModal =
    document.getElementById("closeModal");

const closeLead =
    document.getElementById("closeLead");

const leadDetails =
    document.getElementById("leadDetails");

const modalClientName =
    document.getElementById("modalClientName");

const modalStatus =
    document.getElementById("modalStatus");

const saveStatusButton =
    document.getElementById("saveStatusButton");

const adminEmail =
    document.getElementById("adminEmail");

const logoutButton =
    document.getElementById("logoutButton");



/* =========================================================
   AUTHENTICATION
========================================================= */

onAuthStateChanged(auth, async (user) => {

    if (!user) {

        window.location.href = "login.html";

        return;

    }


    console.log(
        "Management user logged in:",
        user.email
    );


    if (adminEmail) {

        adminEmail.textContent =
            user.email || "";

    }


    await loadLeads();

});



/* =========================================================
   LOGOUT
========================================================= */

if (logoutButton) {

    logoutButton.addEventListener(
        "click",
        async function () {

            logoutButton.disabled = true;

            logoutButton.textContent =
                "Logging out...";


            try {

                await signOut(auth);

                sessionStorage.clear();

                window.location.replace(
                    "./login.html"
                );


            } catch (error) {

                console.error(
                    "Logout failed:",
                    error
                );

                logoutButton.disabled = false;

                logoutButton.textContent =
                    "Logout";

                alert(
                    "Logout failed. Please try again."
                );

            }

        }
    );

}



/* =========================================================
   LOAD LEADS
========================================================= */

async function loadLeads() {

    if (!tableBody) {

        console.error(
            "leadsTableBody not found."
        );

        return;

    }


    tableBody.innerHTML = `

        <tr>

            <td
                colspan="7"
                class="loading-cell"
            >
                Loading leads...
            </td>

        </tr>

    `;


    try {

        const leadsRef =
            collection(
                db,
                "leads"
            );


        const snapshot =
            await getDocs(leadsRef);


        allLeads = [];


        snapshot.forEach(
            (documentSnapshot) => {

                allLeads.push({

                    id: documentSnapshot.id,

                    ...documentSnapshot.data()

                });

            }
        );


        allLeads.sort(
            (a, b) =>
                getDateValue(b) -
                getDateValue(a)
        );


        console.log(
            "Successfully loaded leads:",
            allLeads
        );


        updateStatistics();

        applyFilters();


    } catch (error) {

        console.error(
            "Error loading leads:",
            error
        );


        tableBody.innerHTML = `

            <tr>

                <td
                    colspan="7"
                    class="error-cell"
                >
                    Unable to load leads.
                    ${escapeHTML(
                        error?.code
                            ? `Error: ${error.code}`
                            : ""
                    )}
                </td>

            </tr>

        `;

    }

}



/* =========================================================
   DATE VALUE
========================================================= */

function getDateValue(lead) {

    if (
        !lead ||
        !lead.createdAt
    ) {

        return 0;

    }


    if (
        typeof lead.createdAt.toDate ===
        "function"
    ) {

        return lead.createdAt
            .toDate()
            .getTime();

    }


    if (
        lead.createdAt instanceof Date
    ) {

        return lead.createdAt.getTime();

    }


    const date =
        new Date(
            lead.createdAt
        );


    if (
        !isNaN(
            date.getTime()
        )
    ) {

        return date.getTime();

    }


    return 0;

}



/* =========================================================
   FORMAT DATE
========================================================= */

function formatDate(lead) {

    const value =
        getDateValue(lead);


    if (!value) {

        return "—";

    }


    return new Date(value)
        .toLocaleString(
            "en-IN",
            {
                day: "2-digit",
                month: "short",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit"
            }
        );

}



/* =========================================================
   STATISTICS
========================================================= */

function updateStatistics() {

    const total =
        allLeads.length;


    const newCount =
        allLeads.filter(
            lead =>
                normalizeStatus(
                    lead.status
                ) === "new"
        ).length;


    const contactedCount =
        allLeads.filter(
            lead =>
                normalizeStatus(
                    lead.status
                ) === "contacted"
        ).length;


    const convertedCount =
        allLeads.filter(
            lead =>
                normalizeStatus(
                    lead.status
                ) === "converted"
        ).length;


    if (totalLeads) {

        totalLeads.textContent =
            total;

    }


    if (newLeads) {

        newLeads.textContent =
            newCount;

    }


    if (contactedLeads) {

        contactedLeads.textContent =
            contactedCount;

    }


    if (convertedLeads) {

        convertedLeads.textContent =
            convertedCount;

    }

}



/* =========================================================
   NORMALIZE STATUS
========================================================= */

function normalizeStatus(status) {

    if (!status) {

        return "new";

    }


    return String(status)
        .trim()
        .toLowerCase()
        .replace(
            /\s+/g,
            "-"
        );

}



/* =========================================================
   FORMAT STATUS
========================================================= */

function formatStatus(status) {

    if (!status) {

        return "New";

    }


    return String(status)
        .replace(
            /-/g,
            " "
        )
        .replace(
            /\b\w/g,
            letter =>
                letter.toUpperCase()
        );

}



/* =========================================================
   GET FIELD
========================================================= */

function getField(
    object,
    fields,
    fallback = "—"
) {

    if (!object) {

        return fallback;

    }


    for (
        const field of fields
    ) {

        if (
            object[field] !==
                undefined &&
            object[field] !==
                null &&
            object[field] !== ""
        ) {

            return object[field];

        }

    }


    return fallback;

}



/* =========================================================
   RENDER LEADS
========================================================= */

function renderLeads(leads) {

    if (!tableBody) {

        return;

    }


    if (!leads.length) {

        tableBody.innerHTML = `

            <tr>

                <td
                    colspan="7"
                    class="empty-cell"
                >
                    No client enquiries found.
                </td>

            </tr>

        `;

        return;

    }


    tableBody.innerHTML = "";


    leads.forEach(
        (lead) => {

            const row =
                document.createElement(
                    "tr"
                );


            const name =
                getField(
                    lead,
                    [
                        "fullName",
                        "name",
                        "clientName",
                        "firstName"
                    ],
                    "Unknown Client"
                );


            const email =
                getField(
                    lead,
                    [
                        "email",
                        "emailAddress"
                    ]
                );


            const phone =
                getField(
                    lead,
                    [
                        "mobile",
                        "phone",
                        "phoneNumber",
                        "mobileNumber"
                    ]
                );


            const program =
                getField(
                    lead,
                    [
                        "product",
                        "program",
                        "service",
                        "visaType",
                        "preferredProgram",
                        "jobSector"
                    ]
                );


            const experience =
                getField(
                    lead,
                    [
                        "relevantWorkExperience",
                        "workExperience",
                        "experience"
                    ]
                );


            const status =
                normalizeStatus(
                    lead.status
                );


            row.innerHTML = `

                <td>

                    <div class="client-cell">

                        <strong>
                            ${escapeHTML(
                                name
                            )}
                        </strong>

                        <small>
                            ${escapeHTML(
                                lead.id
                            )}
                        </small>

                    </div>

                </td>


                <td>

                    <div class="contact-cell">

                        <span>
                            ${escapeHTML(
                                email
                            )}
                        </span>

                        <span>
                            ${escapeHTML(
                                phone
                            )}
                        </span>

                    </div>

                </td>


                <td>

                    <div class="program-cell">

                        ${escapeHTML(
                            String(program)
                        )}

                    </div>

                </td>


                <td>

                    ${escapeHTML(
                        String(experience)
                    )}

                </td>


                <td>

                    ${escapeHTML(
                        formatDate(lead)
                    )}

                </td>


                <td>

                    <span
                        class="status status-${escapeHTML(
                            status
                        )}"
                    >

                        ${escapeHTML(
                            formatStatus(status)
                        )}

                    </span>

                </td>


                <td>

                    <button
                        type="button"
                        class="view-button"
                        data-id="${escapeHTML(
                            lead.id
                        )}"
                    >
                        View
                    </button>

                </td>

            `;


            tableBody.appendChild(
                row
            );

        }
    );


    document
        .querySelectorAll(
            ".view-button"
        )
        .forEach(
            button => {

                button.addEventListener(
                    "click",
                    function () {

                        openLead(
                            this.dataset.id
                        );

                    }
                );

            }
        );

}



/* =========================================================
   OPEN LEAD
========================================================= */

function openLead(leadId) {

    selectedLead =
        allLeads.find(
            lead =>
                lead.id ===
                leadId
        );


    if (!selectedLead) {

        console.error(
            "Lead not found:",
            leadId
        );

        return;

    }


    const name =
        getField(
            selectedLead,
            [
                "fullName",
                "name",
                "clientName",
                "firstName"
            ],
            "Client"
        );


    if (modalClientName) {

        modalClientName.textContent =
            name;

    }


    if (modalStatus) {

        modalStatus.value =
            normalizeStatus(
                selectedLead.status
            );

    }


    if (leadDetails) {

        leadDetails.innerHTML = `

            <div class="detail-grid">


                ${detailItem(
                    "Full Name",
                    getField(
                        selectedLead,
                        [
                            "fullName",
                            "name",
                            "clientName"
                        ]
                    )
                )}


                ${detailItem(
                    "Email",
                    getField(
                        selectedLead,
                        [
                            "email",
                            "emailAddress"
                        ]
                    )
                )}


                ${detailItem(
                    "Phone",
                    getField(
                        selectedLead,
                        [
                            "mobile",
                            "phone",
                            "phoneNumber"
                        ]
                    )
                )}


                ${detailItem(
                    "Program",
                    getField(
                        selectedLead,
                        [
                            "product",
                            "program",
                            "service",
                            "visaType"
                        ]
                    )
                )}


                ${detailItem(
                    "Current Job Title",
                    getField(
                        selectedLead,
                        [
                            "currentJobTitle",
                            "jobTitle"
                        ]
                    )
                )}


                ${detailItem(
                    "Passport Status",
                    getField(
                        selectedLead,
                        [
                            "passportStatus"
                        ]
                    )
                )}


                ${detailItem(
                    "German Language",
                    getField(
                        selectedLead,
                        [
                            "germanLanguageLevel",
                            "germanLevel"
                        ]
                    )
                )}


                ${detailItem(
                    "English Language",
                    getField(
                        selectedLead,
                        [
                            "englishLanguageLevel",
                            "englishLevel"
                        ]
                    )
                )}


                ${detailItem(
                    "Work Experience",
                    getField(
                        selectedLead,
                        [
                            "relevantWorkExperience",
                            "workExperience",
                            "experience"
                        ]
                    )
                )}


                ${detailItem(
                    "Preferred Job Sector",
                    getField(
                        selectedLead,
                        [
                            "preferredJobSector",
                            "jobSector"
                        ]
                    )
                )}


                ${detailItem(
                    "Financial Readiness",
                    getField(
                        selectedLead,
                        [
                            "financialReadiness"
                        ]
                    )
                )}


                ${detailItem(
                    "Source",
                    getField(
                        selectedLead,
                        [
                            "source"
                        ]
                    )
                )}


                ${detailItem(
                    "Assigned To",
                    getField(
                        selectedLead,
                        [
                            "assignedTo"
                        ]
                    )
                )}


                ${detailItem(
                    "Submitted",
                    formatDate(
                        selectedLead
                    )
                )}


            </div>


            <div class="additional-information">

                <h3>
                    Additional Information
                </h3>

                <p>
                    ${escapeHTML(
                        getField(
                            selectedLead,
                            [
                                "additionalInformation",
                                "message",
                                "comments"
                            ],
                            "No additional information provided."
                        )
                    )}
                </p>

            </div>


            <div class="additional-information">

                <h3>
                    Management Notes
                </h3>

                <p>
                    ${escapeHTML(
                        getField(
                            selectedLead,
                            [
                                "managementNotes"
                            ],
                            "No management notes added."
                        )
                    )}
                </p>

            </div>

        `;

    }


    if (modal) {

        modal.classList.add(
            "show"
        );

    }

}



/* =========================================================
   DETAIL ITEM
========================================================= */

function detailItem(
    label,
    value
) {

    return `

        <div class="detail-item">

            <span>
                ${escapeHTML(
                    label
                )}
            </span>

            <strong>
                ${escapeHTML(
                    String(
                        value ||
                        "—"
                    )
                )}
            </strong>

        </div>

    `;

}



/* =========================================================
   SAVE STATUS
========================================================= */

if (saveStatusButton) {

    saveStatusButton.addEventListener(
        "click",
        async function () {

            if (!selectedLead) {

                return;

            }


            const newStatus =
                modalStatus?.value ||
                "new";


            saveStatusButton.disabled =
                true;


            saveStatusButton.textContent =
                "Saving...";


            try {

                const leadRef =
                    doc(
                        db,
                        "leads",
                        selectedLead.id
                    );


                await updateDoc(
                    leadRef,
                    {
                        status:
                            newStatus,

                        updatedAt:
                            serverTimestamp()
                    }
                );


                selectedLead.status =
                    newStatus;


                const index =
                    allLeads.findIndex(
                        lead =>
                            lead.id ===
                            selectedLead.id
                    );


                if (index !== -1) {

                    allLeads[
                        index
                    ].status =
                        newStatus;

                }


                updateStatistics();

                applyFilters();


                if (modal) {

                    modal.classList.remove(
                        "show"
                    );

                }


                alert(
                    "Lead status updated successfully."
                );


            } catch (error) {

                console.error(
                    "Status update error:",
                    error
                );


                alert(
                    "Unable to update lead status. Please try again."
                );

            } finally {

                saveStatusButton.disabled =
                    false;

                saveStatusButton.textContent =
                    "Save Status";

            }

        }
    );

}



/* =========================================================
   SEARCH
========================================================= */

if (searchInput) {

    searchInput.addEventListener(
        "input",
        applyFilters
    );

}



/* =========================================================
   PRODUCT FILTER
========================================================= */

if (productFilter) {

    productFilter.addEventListener(
        "change",
        applyFilters
    );

}



/* =========================================================
   STATUS FILTER
========================================================= */

if (statusFilter) {

    statusFilter.addEventListener(
        "change",
        applyFilters
    );

}



/* =========================================================
   APPLY FILTERS
========================================================= */

function applyFilters() {

    const search =
        searchInput
            ? searchInput.value
                .trim()
                .toLowerCase()
            : "";


    const product =
        productFilter
            ? productFilter.value
            : "";


    const status =
        statusFilter
            ? statusFilter.value
            : "all";


    const filtered =
        allLeads.filter(
            lead => {

                const searchableText = [

                    lead.fullName,
                    lead.name,
                    lead.clientName,
                    lead.email,
                    lead.emailAddress,
                    lead.mobile,
                    lead.phone,
                    lead.phoneNumber,
                    lead.product,
                    lead.program,
                    lead.service,
                    lead.visaType,
                    lead.currentJobTitle,
                    lead.preferredJobSector,
                    lead.jobSector,
                    lead.source

                ]
                    .filter(Boolean)
                    .join(" ")
                    .toLowerCase();


                const matchesSearch =
                    !search ||
                    searchableText.includes(
                        search
                    );


                const leadProduct =
                    String(
                        getField(
                            lead,
                            [
                                "product",
                                "program",
                                "service",
                                "visaType"
                            ],
                            ""
                        )
                    );


                const matchesProduct =
                    !product ||
                    leadProduct
                        .toLowerCase()
                        .includes(
                            product.toLowerCase()
                        );


                const matchesStatus =
                    status === "all" ||
                    normalizeStatus(
                        lead.status
                    ) === status;


                return (
                    matchesSearch &&
                    matchesProduct &&
                    matchesStatus
                );

            }
        );


    renderLeads(
        filtered
    );

}



/* =========================================================
   REFRESH
========================================================= */

if (refreshButton) {

    refreshButton.addEventListener(
        "click",
        async function () {

            refreshButton.disabled =
                true;


            refreshButton.textContent =
                "Refreshing...";


            await loadLeads();


            refreshButton.disabled =
                false;


            refreshButton.textContent =
                "↻ Refresh";

        }
    );

}



/* =========================================================
   CLOSE MODAL
========================================================= */

function closeLeadModal() {

    if (modal) {

        modal.classList.remove(
            "show"
        );

    }


    selectedLead = null;

}


if (closeModal) {

    closeModal.addEventListener(
        "click",
        closeLeadModal
    );

}


if (closeLead) {

    closeLead.addEventListener(
        "click",
        closeLeadModal
    );

}



/* =========================================================
   ESCAPE KEY
========================================================= */

document.addEventListener(
    "keydown",
    function (event) {

        if (
            event.key === "Escape" &&
            modal?.classList.contains(
                "show"
            )
        ) {

            closeLeadModal();

        }

    }
);



/* =========================================================
   SIDEBAR NAVIGATION
========================================================= */

const navLinks =
    document.querySelectorAll(
        ".nav-link"
    );


navLinks.forEach(
    link => {

        link.addEventListener(
            "click",
            function () {

                navLinks.forEach(
                    item =>
                        item.classList.remove(
                            "active"
                        )
                );


                this.classList.add(
                    "active"
                );

            }
        );

    }
);



/* =========================================================
   NEW LEADS
========================================================= */

function showNewLeadsOnly() {

    if (!statusFilter) {

        return;

    }


    statusFilter.value =
        "new";


    applyFilters();

}



/* =========================================================
   HASH NAVIGATION
========================================================= */

function handleHashNavigation() {

    const hash =
        window.location.hash;


    navLinks.forEach(
        link =>
            link.classList.remove(
                "active"
            )
    );


    if (
        hash === "#new-leads"
    ) {

        document
            .getElementById(
                "newLeadsNav"
            )
            ?.classList.add(
                "active"
            );

        showNewLeadsOnly();


    } else if (
        hash === "#leads"
    ) {

        document
            .getElementById(
                "clientLeadsNav"
            )
            ?.classList.add(
                "active"
            );


        if (statusFilter) {

            statusFilter.value =
                "all";

        }


        applyFilters();


    } else {

        document
            .getElementById(
                "dashboardNav"
            )
            ?.classList.add(
                "active"
            );

    }

}


window.addEventListener(
    "hashchange",
    handleHashNavigation
);


setTimeout(
    handleHashNavigation,
    300
);



/* =========================================================
   ESCAPE HTML
========================================================= */

function escapeHTML(value) {

    return String(
        value ?? ""
    )
        .replace(
            /&/g,
            "&amp;"
        )
        .replace(
            /</g,
            "&lt;"
        )
        .replace(
            />/g,
            "&gt;"
        )
        .replace(
            /"/g,
            "&quot;"
        )
        .replace(
            /'/g,
            "&#039;"
        );

}