"use strict";

/*
====================================================
 GATEFLOW
 Smart Apartment Visitor Management
 Designed & built by Team Rasika
====================================================

 Current prototype storage:
 Browser localStorage.

 Future production architecture:
 Backend database + authentication + resident approval.
====================================================
*/


/* =========================
   STORAGE
========================= */

const STORAGE_KEY = "gateflow_team_rasika_visitors";

let visitors = loadVisitors();

let pendingExitId = null;


/* =========================
   DOM
========================= */

const form = document.getElementById("visitorForm");

const nameInput =
  document.getElementById("name");

const wingInput =
  document.getElementById("wing");

const flatInput =
  document.getElementById("flat");

const phoneInput =
  document.getElementById("phone");

const visitorTypeInput =
  document.getElementById("visitorType");

const purposeInput =
  document.getElementById("purpose");

const formError =
  document.getElementById("formError");

const insideList =
  document.getElementById("insideList");

const allVisitorsList =
  document.getElementById("allVisitorsList");

const historyList =
  document.getElementById("historyList");

const searchInput =
  document.getElementById("searchFlat");

const clearSearch =
  document.getElementById("clearSearch");

const insideCount =
  document.getElementById("insideCount");

const todayCount =
  document.getElementById("todayCount");

const exitCount =
  document.getElementById("exitCount");

const totalCount =
  document.getElementById("totalCount");

const insideBadge =
  document.getElementById("insideBadge");

const visitorBreakdown =
  document.getElementById("visitorBreakdown");

const lastEntry =
  document.getElementById("lastEntry");

const lastExit =
  document.getElementById("lastExit");

const currentTime =
  document.getElementById("currentTime");

const currentDate =
  document.getElementById("currentDate");

const toast =
  document.getElementById("toast");

const toastMessage =
  document.getElementById("toastMessage");

const toastIcon =
  document.getElementById("toastIcon");

const exitModal =
  document.getElementById("exitModal");

const exitModalMessage =
  document.getElementById("exitModalMessage");

const cancelExit =
  document.getElementById("cancelExit");

const confirmExit =
  document.getElementById("confirmExit");


/* =========================
   STORAGE FUNCTIONS
========================= */

function loadVisitors() {

  try {

    const stored =
      localStorage.getItem(STORAGE_KEY);

    if (!stored) {
      return [];
    }

    const data =
      JSON.parse(stored);

    if (!Array.isArray(data)) {
      return [];
    }

    return data;

  } catch (error) {

    console.error(
      "Storage error:",
      error
    );

    return [];
  }
}


function saveVisitors() {

  try {

    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(visitors)
    );

  } catch (error) {

    console.error(
      "Could not save visitor records:",
      error
    );

    showToast(
      "Could not save record on this device.",
      "!"
    );
  }
}


/* =========================
   SAFE TEXT
========================= */

function escapeHTML(value) {

  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}


/* =========================
   DATE HELPERS
========================= */

function todayKey() {

  const now = new Date();

  return [
    now.getFullYear(),

    String(
      now.getMonth() + 1
    ).padStart(2, "0"),

    String(
      now.getDate()
    ).padStart(2, "0")

  ].join("-");
}


function dateKey(value) {

  const date =
    new Date(value);

  return [
    date.getFullYear(),

    String(
      date.getMonth() + 1
    ).padStart(2, "0"),

    String(
      date.getDate()
    ).padStart(2, "0")

  ].join("-");
}


function isToday(value) {

  return dateKey(value) === todayKey();
}


function formatTime(value) {

  const date =
    new Date(value);

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return "--";
  }

  return date.toLocaleTimeString(
    "en-IN",
    {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true
    }
  );
}


function formatDateTime(value) {

  const date =
    new Date(value);

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return "--";
  }

  return date.toLocaleString(
    "en-IN",
    {
      day: "2-digit",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true
    }
  );
}


/* =========================
   VALIDATION
========================= */

function validName(name) {

  return (
    name.length >= 2 &&
    /^[A-Za-zÀ-ÿ][A-Za-zÀ-ÿ .'-]*$/
      .test(name)
  );
}


function validPhone(phone) {

  return /^[6-9]\d{9}$/
    .test(phone);
}


function validFlat(flat) {

  return (
    Number.isInteger(flat) &&
    flat >= 1 &&
    flat <= 40
  );
}


function showFormError(message) {

  formError.textContent =
    message;

  formError.style.color =
    "var(--red)";
}


function clearFormError() {

  formError.textContent = "";
}


/* =========================
   FORM SUBMISSION
========================= */

form.addEventListener(
  "submit",
  function (event) {

    event.preventDefault();

    clearFormError();

    const name =
      nameInput.value.trim();

    const wing =
      wingInput.value;

    const flat =
      Number.parseInt(
        flatInput.value,
        10
      );

    const phone =
      phoneInput.value
        .replace(/\D/g, "");

    const visitorType =
      visitorTypeInput.value;

    const purpose =
      purposeInput.value.trim();


    if (!validName(name)) {

      showFormError(
        "Please enter a valid visitor name."
      );

      nameInput.focus();

      return;
    }


    if (
      wing !== "A" &&
      wing !== "B"
    ) {

      showFormError(
        "Please select a wing."
      );

      wingInput.focus();

      return;
    }


    if (!validFlat(flat)) {

      showFormError(
        "Flat number must be between 1 and 40."
      );

      flatInput.focus();

      return;
    }


    if (!validPhone(phone)) {

      showFormError(
        "Enter a valid 10-digit Indian mobile number."
      );

      phoneInput.focus();

      return;
    }


    if (!visitorType) {

      showFormError(
        "Please select a visitor type."
      );

      visitorTypeInput.focus();

      return;
    }


    if (purpose.length < 2) {

      showFormError(
        "Please enter the purpose of visit."
      );

      purposeInput.focus();

      return;
    }


    /*
      Prevent accidental duplicate active entries
      for the exact same visitor/flat/phone.
    */

    const duplicate =
      visitors.some(
        visitor =>
          visitor.status === "inside" &&
          visitor.phone === phone &&
          visitor.wing === wing &&
          Number(visitor.flat) === flat
      );


    if (duplicate) {

      showFormError(
        "This visitor is already marked as inside."
      );

      return;
    }


    const visitor = {

      id:
        `${Date.now()}-${Math.random()
          .toString(36)
          .slice(2, 8)}`,

      name,

      wing,

      flat,

      phone,

      visitorType,

      purpose,

      entryTime:
        new Date().toISOString(),

      exitTime:
        null,

      status:
        "inside"
    };


    visitors.push(visitor);

    saveVisitors();

    form.reset();

    renderEverything();

    clearFormError();

    showToast(
      `${name} registered successfully.`,
      "✓"
    );

    nameInput.focus();
  }
);


/* =========================
   SEARCH
========================= */

searchInput.addEventListener(
  "input",
  function () {

    renderEverything();

  }
);


clearSearch.addEventListener(
  "click",
  function () {

    searchInput.value = "";

    renderEverything();

    searchInput.focus();

  }
);


/* =========================
   SEARCH MATCH
========================= */

function matchesSearch(
  visitor,
  query
) {

  if (!query) {
    return true;
  }

  const searchable = [

    visitor.name,

    visitor.wing,

    visitor.flat,

    `${visitor.wing}-${visitor.flat}`,

    `${visitor.wing}${visitor.flat}`,

    visitor.phone,

    visitor.visitorType,

    visitor.purpose

  ]
    .join(" ")
    .toLowerCase();


  return searchable.includes(
    query.toLowerCase()
  );
}


/* =========================
   EXIT MODAL
========================= */

function openExitModal(id) {

  const visitor =
    visitors.find(
      item =>
        String(item.id) ===
        String(id)
    );


  if (
    !visitor ||
    visitor.status !== "inside"
  ) {
    return;
  }


  pendingExitId =
    visitor.id;


  exitModalMessage.textContent =
    `Mark ${visitor.name} from ${visitor.wing}-${visitor.flat} as exited?`;


  exitModal.classList.remove(
    "hidden"
  );


  confirmExit.focus();
}


function closeExitModal() {

  pendingExitId = null;

  exitModal.classList.add(
    "hidden"
  );
}


cancelExit.addEventListener(
  "click",
  closeExitModal
);


exitModal.addEventListener(
  "click",
  function (event) {

    if (
      event.target ===
      exitModal
    ) {

      closeExitModal();

    }

  }
);


document.addEventListener(
  "keydown",
  function (event) {

    if (
      event.key === "Escape" &&
      !exitModal.classList.contains(
        "hidden"
      )
    ) {

      closeExitModal();

    }

  }
);


confirmExit.addEventListener(
  "click",
  function () {

    if (!pendingExitId) {

      closeExitModal();

      return;
    }


    markExit(
      pendingExitId
    );

    closeExitModal();

  }
);


/* =========================
   MARK EXIT
========================= */

function markExit(id) {

  const visitor =
    visitors.find(
      item =>
        String(item.id) ===
        String(id)
    );


  if (
    !visitor ||
    visitor.status !== "inside"
  ) {

    return;
  }


  visitor.status =
    "exited";

  visitor.exitTime =
    new Date().toISOString();


  saveVisitors();

  renderEverything();


  showToast(
    `${visitor.name} checked out.`,
    "✓"
  );
}


/* =========================
   CURRENTLY INSIDE
========================= */

function renderInside() {

  const query =
    searchInput.value.trim();


  const list =
    visitors
      .filter(
        visitor =>
          visitor.status === "inside"
      )
      .filter(
        visitor =>
          matchesSearch(
            visitor,
            query
          )
      )
      .sort(
        (a, b) =>
          new Date(b.entryTime) -
          new Date(a.entryTime)
      );


  insideBadge.textContent =
    list.length;


  if (list.length === 0) {

    insideList.innerHTML = `

      <div class="empty-state">

        <div class="empty-icon">
          ✓
        </div>

        <strong>
          ${
            query
              ? "No matching visitors"
              : "Gate is clear"
          }
        </strong>

        <span>
          ${
            query
              ? "Try another search."
              : "No visitors are currently inside."
          }
        </span>

      </div>

    `;

    return;
  }


  insideList.innerHTML =
    list
      .map(
        visitor =>
          visitorCardHTML(
            visitor,
            true
          )
      )
      .join("");


  attachExitButtons();
}


/* =========================
   VISITOR CARD
========================= */

function visitorCardHTML(
  visitor,
  showExitButton = false
) {

  const statusClass =
    visitor.status === "inside"
      ? "inside"
      : "exited";


  const statusText =
    visitor.status === "inside"
      ? "INSIDE"
      : "EXITED";


  const type =
    escapeHTML(
      visitor.visitorType ||
      "Other"
    );


  const purpose =
    escapeHTML(
      visitor.purpose ||
      "Not specified"
    );


  return `

    <article
      class="visitor-card
      ${visitor.status === "exited"
        ? "exited"
        : ""}"
    >

      <div class="visitor-main">

        <div class="visitor-name-row">

          <span class="visitor-name">
            ${escapeHTML(visitor.name)}
          </span>

          <span
            class="status-pill ${statusClass}"
          >
            ${statusText}
          </span>

          <span class="type-pill">
            ${type}
          </span>

        </div>


        <div class="visitor-meta">

          <span>
            <strong>Flat</strong>
            ${escapeHTML(visitor.wing)}-${escapeHTML(visitor.flat)}
          </span>

          <span>
            <strong>Phone</strong>
            ${escapeHTML(visitor.phone)}
          </span>

        </div>


        <div class="visitor-purpose">

          <strong>Purpose:</strong>
          ${purpose}

        </div>


        <div class="visitor-time">

          ${
            visitor.status === "inside"
              ? `Entered ${escapeHTML(
                  formatDateTime(
                    visitor.entryTime
                  )
                )}`
              : `Entry ${escapeHTML(
                  formatTime(
                    visitor.entryTime
                  )
                )}
                 • Exit ${escapeHTML(
                   formatTime(
                     visitor.exitTime
                   )
                 )}`
          }

        </div>

      </div>


      ${
        showExitButton
          ? `
            <button
              class="exit-button"
              type="button"
              data-exit-id="${escapeHTML(visitor.id)}"
            >
              Check Out
            </button>
          `
          : ""
      }

    </article>

  `;
}


/* =========================
   ALL VISITOR RECORDS
========================= */

function renderAllVisitors() {

  const query =
    searchInput.value.trim();


  const list =
    visitors
      .filter(
        visitor =>
          matchesSearch(
            visitor,
            query
          )
      )
      .sort(
        (a, b) =>
          new Date(b.entryTime) -
          new Date(a.entryTime)
      );


  if (list.length === 0) {

    allVisitorsList.innerHTML = `

      <div class="empty-state">

        <div class="empty-icon">
          ⌕
        </div>

        <strong>
          No records found
        </strong>

        <span>
          Try changing your search.
        </span>

      </div>

    `;

    return;
  }


  allVisitorsList.innerHTML =
    list
      .map(
        visitor =>
          visitorCardHTML(
            visitor,
            visitor.status === "inside"
          )
      )
      .join("");


  attachExitButtons();
}


/* =========================
   TODAY'S HISTORY
========================= */

function renderHistory() {

  const query =
    searchInput.value.trim();


  const list =
    visitors
      .filter(
        visitor =>
          isToday(
            visitor.entryTime
          )
      )
      .filter(
        visitor =>
          matchesSearch(
            visitor,
            query
          )
      )
      .sort(
        (a, b) =>
          new Date(b.entryTime) -
          new Date(a.entryTime)
      );


  if (list.length === 0) {

    historyList.innerHTML = `

      <div class="empty-state">

        <div class="empty-icon">
          ◷
        </div>

        <strong>
          No activity yet
        </strong>

        <span>
          Today's visitor activity will appear here.
        </span>

      </div>

    `;

    return;
  }


  historyList.innerHTML =
    list
      .map(
        visitor =>
          visitorCardHTML(
            visitor,
            visitor.status === "inside"
          )
      )
      .join("");


  attachExitButtons();
}


/* =========================
   BUTTON EVENTS
========================= */

function attachExitButtons() {

  const buttons =
    document.querySelectorAll(
      "[data-exit-id]"
    );


  buttons.forEach(
    button => {

      button.addEventListener(
        "click",
        function () {

          openExitModal(
            this.dataset.exitId
          );

        }
      );

    }
  );
}


/* =========================
   BREAKDOWN
========================= */

function renderBreakdown() {

  const today =
    visitors.filter(
      visitor =>
        isToday(
          visitor.entryTime
        )
    );


  const types = {

    Guest: 0,

    Delivery: 0,

    "Cab / Driver": 0,

    Maintenance: 0,

    Other: 0

  };


  today.forEach(
    visitor => {

      const type =
        visitor.visitorType;

      if (
        Object.prototype.hasOwnProperty
          .call(types, type)
      ) {

        types[type]++;

      } else {

        types.Other++;

      }

    }
  );


  const total =
    today.length;


  if (total === 0) {

    visitorBreakdown.innerHTML = `

      <div class="empty-state">

        <span>
          Visitor type statistics will appear after the first entry.
        </span>

      </div>

    `;

    return;
  }


  visitorBreakdown.innerHTML =
    Object.entries(types)
      .map(
        ([type, count]) => {

          const percentage =
            total === 0
              ? 0
              : Math.round(
                  (count / total) *
                  100
                );


          return `

            <div class="breakdown-row">

              <span class="breakdown-name">
                ${escapeHTML(type)}
              </span>

              <div class="progress">
                <span
                  style="width:${percentage}%"
                ></span>
              </div>

              <span class="breakdown-value">
                ${count}
              </span>

            </div>

          `;

        }
      )
      .join("");
}


/* =========================
   DASHBOARD STATS
========================= */

function renderStats() {

  const inside =
    visitors.filter(
      visitor =>
        visitor.status === "inside"
    );


  const today =
    visitors.filter(
      visitor =>
        isToday(
          visitor.entryTime
        )
    );


  const exits =
    visitors.filter(
      visitor =>
        visitor.exitTime &&
        isToday(
          visitor.exitTime
        )
    );


  insideCount.textContent =
    inside.length;

  todayCount.textContent =
    today.length;

  exitCount.textContent =
    exits.length;

  totalCount.textContent =
    visitors.length;


  const latestEntry =
    [...visitors]
      .sort(
        (a, b) =>
          new Date(b.entryTime) -
          new Date(a.entryTime)
      )[0];


  const latestExit =
    [...visitors]
      .filter(
        visitor =>
          visitor.exitTime
      )
      .sort(
        (a, b) =>
          new Date(b.exitTime) -
          new Date(a.exitTime)
      )[0];


  lastEntry.textContent =
    latestEntry
      ? `${latestEntry.name} • ${formatTime(
          latestEntry.entryTime
        )}`
      : "No entries yet";


  lastExit.textContent =
    latestExit
      ? `${latestExit.name} • ${formatTime(
          latestExit.exitTime
        )}`
      : "No exits yet";
}


/* =========================
   CLOCK
========================= */

function updateClock() {

  const now =
    new Date();


  currentTime.textContent =
    now.toLocaleTimeString(
      "en-IN",
      {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: true
      }
    );


  currentDate.textContent =
    now.toLocaleDateString(
      "en-IN",
      {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric"
      }
    );
}


updateClock();

setInterval(
  updateClock,
  1000
);


/* =========================
   TOAST
========================= */

let toastTimer;


function showToast(
  message,
  icon = "✓"
) {

  toastMessage.textContent =
    message;

  toastIcon.textContent =
    icon;


  toast.classList.add(
    "show"
  );


  clearTimeout(
    toastTimer
  );


  toastTimer =
    setTimeout(
      () => {

        toast.classList.remove(
          "show"
        );

      },
      3000
    );
}


/* =========================
   NAVIGATION
========================= */

const navItems =
  document.querySelectorAll(
    ".nav-item"
  );


const sections = {

  dashboard:
    document.getElementById(
      "dashboardSection"
    ),

  visitors:
    document.getElementById(
      "visitorsSection"
    ),

  activity:
    document.getElementById(
      "activitySection"
    )

};


navItems.forEach(
  button => {

    button.addEventListener(
      "click",
      function () {

        const target =
          this.dataset.section;


        navItems.forEach(
          item =>
            item.classList.remove(
              "active"
            )
        );


        this.classList.add(
          "active"
        );


        Object.values(
          sections
        ).forEach(
          section =>
            section.classList.add(
              "hidden-section"
            )
        );


        sections[target]
          .classList.remove(
            "hidden-section"
          );


        window.scrollTo({
          top: 0,
          behavior: "smooth"
        });

      }
    );

  }
);


/* =========================
   PHONE INPUT
========================= */

phoneInput.addEventListener(
  "input",
  function () {

    this.value =
      this.value
        .replace(/\D/g, "")
        .slice(0, 10);

  }
);


/* =========================
   FLAT INPUT
========================= */

flatInput.addEventListener(
  "input",
  function () {

    this.value =
      this.value
        .replace(/\D/g, "")
        .slice(0, 2);

  }
);


/* =========================
   INITIAL RENDER
========================= */

function renderEverything() {

  renderStats();

  renderInside();

  renderAllVisitors();

  renderHistory();

  renderBreakdown();
}


renderEverything();