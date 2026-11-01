/* =====================================================
   DNSLYTIC
   DNS Lookup Frontend
   ================================================= */


/* =====================================================
   DOM ELEMENTS
   ===================================================== */

const lookupForm =
    document.getElementById("lookupForm");

const domainInput =
    document.getElementById("domainInput");

const lookupButton =
    document.getElementById("lookupButton");

const resultsSection =
    document.getElementById("resultsSection");

const resultDomain =
    document.getElementById("resultDomain");

const recordCount =
    document.getElementById("recordCount");

const responseTime =
    document.getElementById("responseTime");

const resultStatus =
    document.getElementById("resultStatus");

const recordTypeCount =
    document.getElementById("recordTypeCount");

const recordsContainer =
    document.getElementById("recordsContainer");

const clearButton =
    document.getElementById("clearButton");

const errorMessage =
    document.getElementById("errorMessage");



/* =====================================================
   FORM SUBMISSION
   ===================================================== */

lookupForm.addEventListener(
    "submit",
    async function (event) {

        event.preventDefault();

        const domain =
            domainInput.value.trim();


        if (!domain) {

            showError(
                "Please enter a domain name."
            );

            domainInput.focus();

            return;
        }


        await lookupDomain(domain);

    }
);



/* =====================================================
   DNS LOOKUP
   ===================================================== */

async function lookupDomain(domain) {

    setLoading(true);

    hideError();


    try {

        const startTime =
            performance.now();


        const response =
            await fetch(
                `/api/lookup?domain=${encodeURIComponent(domain)}`
            );


        const data =
            await response.json();


        const endTime =
            performance.now();


        /*
         * If the backend does not provide
         * response_time, calculate it here.
         */

        if (
            typeof data.response_time !==
            "number"
        ) {

            data.response_time =
                endTime - startTime;
        }


        if (
            !response.ok ||
            !data.success
        ) {

            throw new Error(
                data.error ||
                "DNS lookup failed."
            );
        }


        renderResults(data);


    } catch (error) {

        console.error(
            "DNS lookup error:",
            error
        );


        showError(
            error.message ||
            "Unable to complete DNS lookup."
        );


    } finally {

        setLoading(false);
    }

}



/* =====================================================
   RENDER RESULTS
   ===================================================== */

function renderResults(data) {

    resultsSection.classList.remove(
        "hidden"
    );


    resultDomain.textContent =
        data.domain || "Unknown";


    const records =
        data.records || {};


    const recordTypes =
        Object.keys(records);


    let totalRecords = 0;


    recordTypes.forEach(
        function (type) {

            const values =
                records[type];


            if (
                Array.isArray(values)
            ) {

                totalRecords +=
                    values.length;

            } else if (
                values !== null &&
                values !== undefined
            ) {

                totalRecords += 1;
            }

        }
    );


    /*
     * Use backend record_count when
     * available.
     */

    recordCount.textContent =
        data.record_count ??
        totalRecords;


    responseTime.textContent =
        `${Number(
            data.response_time || 0
        ).toFixed(0)} ms`;


    resultStatus.textContent =
        "RESOLVED";


    recordTypeCount.textContent =
        recordTypes.length;


    recordsContainer.innerHTML =
        "";


    /*
     * Display every DNS record.
     */

    recordTypes.forEach(
        function (type) {

            let values =
                records[type];


            if (
                !Array.isArray(values)
            ) {

                values = [values];

            }


            const info =
                data.record_info?.[type] ||
                {};


            values.forEach(
                function (record) {

                    const row =
                        createRecordRow(
                            type,
                            record,
                            info
                        );


                    recordsContainer.appendChild(
                        row
                    );

                }
            );

        }
    );


    /*
     * If no records were returned.
     */

    if (
        recordsContainer.children.length === 0
    ) {

        const emptyRow =
            document.createElement("div");


        emptyRow.className =
            "dns-table-row";


        emptyRow.innerHTML = `
            <div class="dns-type">—</div>
            <div class="dns-name">No records</div>
            <div class="dns-value">
                No DNS records were returned.
            </div>
            <div></div>
        `;


        recordsContainer.appendChild(
            emptyRow
        );

    }


    resultsSection.scrollIntoView({
        behavior: "smooth",
        block: "start"
    });

}



/* =====================================================
   CREATE RECORD ROW
   ===================================================== */

function createRecordRow(
    type,
    record,
    info
) {

    const row =
        document.createElement("div");


    row.className =
        "dns-table-row";



    /*
     * TYPE
     */

    const typeCell =
        document.createElement("div");


    typeCell.className =
        "dns-type";


    typeCell.textContent =
        type;



    /*
     * RECORD NAME
     */

    const nameCell =
        document.createElement("div");


    nameCell.className =
        "dns-name";


    nameCell.textContent =
        info.name ||
        getRecordName(type);



    /*
     * VALUE
     */

    const valueCell =
        document.createElement("div");


    valueCell.className =
        "dns-value";


    const formatted =
        formatRecord(
            record,
            type
        );


    valueCell.textContent =
        formatted;



    /*
     * COPY BUTTON
     */

    const actionCell =
        document.createElement("div");


    const copyButton =
        document.createElement("button");


    copyButton.type =
        "button";


    copyButton.className =
        "copy-button";


    copyButton.textContent =
        "COPY";


    copyButton.addEventListener(
        "click",
        async function () {

            await copyToClipboard(
                formatted,
                copyButton
            );

        }
    );


    actionCell.appendChild(
        copyButton
    );


    row.appendChild(
        typeCell
    );


    row.appendChild(
        nameCell
    );


    row.appendChild(
        valueCell
    );


    row.appendChild(
        actionCell
    );


    return row;
}



/* =====================================================
   RECORD NAMES
   ===================================================== */

function getRecordName(type) {

    const names = {

        A:
            "IPv4 Address",

        AAAA:
            "IPv6 Address",

        CAA:
            "Certificate Authority",

        CNAME:
            "Canonical Name",

        MX:
            "Mail Server",

        NS:
            "Name Server",

        TXT:
            "Text Record",

        SOA:
            "Start of Authority"

    };


    return (
        names[type] ||
        "DNS Record"
    );
}



/* =====================================================
   FORMAT RECORD
   ===================================================== */

function formatRecord(
    record,
    type
) {


    /*
     * MX
     */

    if (
        type === "MX" &&
        typeof record === "object"
    ) {

        const priority =
            record.priority ??
            "";

        const value =
            record.value ??
            record.exchange ??
            "";


        return (
            `Priority: ${priority} | ` +
            `Mail server: ${value}`
        );

    }



    /*
     * SOA
     */

    if (
        type === "SOA" &&
        typeof record === "object"
    ) {

        return (
            `Primary DNS: ${record.mname || ""} ` +
            `| Responsible: ${record.rname || ""} ` +
            `| Serial: ${record.serial || ""} ` +
            `| Refresh: ${record.refresh || ""} ` +
            `| Retry: ${record.retry || ""} ` +
            `| Expire: ${record.expire || ""} ` +
            `| Minimum TTL: ${record.minimum || ""}`
        );

    }



    /*
     * CAA
     */

    if (
        type === "CAA" &&
        typeof record === "object"
    ) {

        return (
            `${record.flags ?? 0} ` +
            `${record.tag ?? ""} ` +
            `"${record.value ?? ""}"`
        );

    }



    /*
     * Objects returned by other
     * DNS libraries.
     */

    if (
        typeof record === "object" &&
        record !== null
    ) {

        if (
            record.value !== undefined
        ) {

            return String(
                record.value
            );

        }


        return JSON.stringify(
            record
        );

    }



    /*
     * Standard string records.
     */

    return String(
        record ?? ""
    );

}



/* =====================================================
   COPY TO CLIPBOARD
   ===================================================== */

async function copyToClipboard(
    text,
    button
) {

    try {

        await navigator.clipboard.writeText(
            text
        );


        const originalText =
            button.textContent;


        button.textContent =
            "COPIED";


        button.classList.add(
            "copied"
        );


        setTimeout(
            function () {

                button.textContent =
                    originalText;


                button.classList.remove(
                    "copied"
                );

            },
            1200
        );


    } catch (error) {

        console.error(
            "Clipboard error:",
            error
        );

    }

}



/* =====================================================
   LOADING STATE
   ===================================================== */

function setLoading(
    isLoading
) {


    const buttonText =
        lookupButton.querySelector(
            ".button-text"
        );


    const buttonIcon =
        lookupButton.querySelector(
            ".button-icon"
        );


    if (isLoading) {

        lookupButton.classList.add(
            "loading"
        );


        buttonText.textContent =
            "QUERYING";


        buttonIcon.textContent =
            "…";


    } else {

        lookupButton.classList.remove(
            "loading"
        );


        buttonText.textContent =
            "DNS LOOKUP";


        buttonIcon.textContent =
            "→";

    }

}



/* =====================================================
   CLEAR RESULTS
   ===================================================== */

clearButton.addEventListener(
    "click",
    function () {

        resultsSection.classList.add(
            "hidden"
        );


        recordsContainer.innerHTML =
            "";


        domainInput.value =
            "";


        hideError();


        domainInput.focus();

    }
);



/* =====================================================
   ERROR
   ===================================================== */

function showError(
    message
) {

    errorMessage.textContent =
        message;


    errorMessage.classList.remove(
        "hidden"
    );

}



function hideError() {

    errorMessage.textContent =
        "";


    errorMessage.classList.add(
        "hidden"
    );

}



/* =====================================================
   ESCAPE HTML
   ===================================================== */

/*
 * Kept here for safety and for any future
 * dynamically-generated HTML.
 */

function escapeHTML(value) {

    const div =
        document.createElement(
            "div"
        );


    div.textContent =
        String(value);


    return div.innerHTML;
}
