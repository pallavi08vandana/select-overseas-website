import { db } from "./firebase-init.js";
import { addDoc, collection, serverTimestamp } from "https://www.gstatic.com/firebasejs/12.16.0/firebase-firestore.js";

const menuToggle = document.getElementById("menuToggle");
const mainNav = document.getElementById("mainNav");
menuToggle?.addEventListener("click", () => mainNav?.classList.toggle("open"));
document.querySelectorAll(".main-nav a").forEach(a =>
  a.addEventListener("click", () => mainNav?.classList.remove("open"))
);

const productQuestions = {
  "Germany Opportunity Card": [
    ["German Language Level","select",["None","A1","A2","B1","B2","C1","C2"]],
    ["English Language Level","select",["Basic","Intermediate","Good","Excellent"]],
    ["Relevant Work Experience","text"],
    ["Preferred Job Sector","text"],
    ["Financial Readiness","select",["Ready to provide proof","Need guidance","Not sure"]]
  ],
  "Germany EU Blue Card": [
    ["German Job Offer","select",["Yes","No","In discussion","Not yet"]],
    ["Employer Name","text"],["Job Position","text"],["Current / Offered Salary","text"],
    ["Degree Recognition Status","select",["Recognized","In process","Not sure","Not assessed"]]
  ],
  "Ireland Critical Skills Employment Permit": [
    ["Occupation","text"],["Job Offer Available","select",["Yes","No","In discussion"]],
    ["Employer Name","text"],["Salary Offered","text"],
    ["English Level","select",["Basic","Intermediate","Good","Excellent"]]
  ],
  "Netherlands Highly Skilled Migrant": [
    ["Occupation","text"],["Job Offer Available","select",["Yes","No","In discussion"]],
    ["Employer Name","text"],["IND Recognized Sponsor","select",["Yes","No","Not sure"]],
    ["Salary Offered","text"]
  ],
  "New Zealand Employment Pathway": [
    ["Preferred Job Category","select",["Agriculture","Warehouse","Logistics","Other"]],
    ["Physical Work Experience","select",["Yes","No"]],
    ["Previous Overseas Work Experience","text"],
    ["English Level","select",["Basic","Intermediate","Good","Excellent"]],
    ["Current Occupation","text"]
  ],
  "European Employment Pathway": [
    ["Preferred European Country","text"],
    ["Preferred Job Category","select",["Agriculture","Warehouse","Hospitality","Construction","Caregiving","IT / Technical","Other"]],
    ["Current Occupation","text"],
    ["Driving Experience","select",["Yes","No","Not applicable"]],
    ["Current Visa Status","text"]
  ]
};

const allowedProducts = new Set(Object.keys(productQuestions));
const modal = document.getElementById("formModal");
const modalTitle = document.getElementById("modalTitle");
const selectedProduct = document.getElementById("selectedProduct");
const dynamicFields = document.getElementById("dynamicFields");
const productForm = document.getElementById("productForm");
const productSuccess = document.getElementById("productSuccess");
const productError = document.getElementById("productError");
const quickForm = document.getElementById("quickForm");
const quickSuccess = document.getElementById("quickSuccess");
const quickError = document.getElementById("quickError");

function openProductForm(product) {
  if (!modal || !selectedProduct) return;
  modal.classList.add("open");
  modal.setAttribute("aria-hidden", "false");
  selectedProduct.value = product;
  modalTitle.textContent = `${product} – Eligibility Assessment`;
  dynamicFields.innerHTML = "";
  productSuccess?.classList.remove("show");
  productError?.classList.remove("show");

  (productQuestions[product] || []).forEach(([label, type, options]) => {
    const wrapper = document.createElement("label");
    wrapper.textContent = `${label} *`;
    const name = label.toLowerCase().replace(/[^a-z0-9]+/g, "_");

    if (type === "select") {
      const select = document.createElement("select");
      select.name = name;
      select.required = true;
      select.innerHTML =
        `<option value="">Select</option>` +
        options.map(option => `<option value="${escapeHtml(option)}">${escapeHtml(option)}</option>`).join("");
      wrapper.appendChild(select);
    } else {
      const input = document.createElement("input");
      input.type = "text";
      input.name = name;
      input.required = true;
      wrapper.appendChild(input);
    }
    dynamicFields.appendChild(wrapper);
  });

  document.body.style.overflow = "hidden";
}

function closeModal() {
  modal?.classList.remove("open");
  modal?.setAttribute("aria-hidden", "true");
  document.body.style.overflow = "";
}

function escapeHtml(value) {
  return String(value ?? "").replace(/[&<>"']/g, c => ({
    "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"
  }[c]));
}

document.querySelectorAll("[data-form]").forEach(button => {
  button.addEventListener("click", () => openProductForm(button.dataset.form));
});
document.querySelectorAll("[data-close-modal]").forEach(element => element.addEventListener("click", closeModal));
document.addEventListener("keydown", event => {
  if (event.key === "Escape" && modal?.classList.contains("open")) closeModal();
});

function formToObject(form) {
  const data = {};
  new FormData(form).forEach((value, key) => {
    if (typeof value === "string") {
      data[key] = value.trim();
    }
  });

  const file = form.querySelector('input[type="file"][name="cv"]');
  if (file?.files?.length) {
    data.cvFileName = file.files[0].name;
    data.cvProvided = true;
  } else {
    data.cvProvided = false;
  }

  return data;
}

async function saveLead(data, source = "website") {
  const product = data.product || data.destination;
  if (!allowedProducts.has(product)) {
    throw new Error("Invalid product selected.");
  }

  const lead = {
    ...data,
    fullName: data.fullName || data.name || "",
    mobile: data.mobile || data.phone || "",
    email: data.email || "",
    product,
    source,
    status: "New",
    assignedTo: "",
    followUpDate: null,
    managementNotes: "",
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  };

  // Remove public-form aliases after mapping them to the common lead schema.
  delete lead.name;
  delete lead.phone;
  delete lead.destination;
  delete lead.consent;

  if (!lead.fullName || !lead.mobile || !lead.email || !lead.product) {
    throw new Error("Please complete all required fields.");
  }

  const ref = await addDoc(collection(db, "leads"), lead);
  return ref.id;
}

async function submitProductForm(event) {
  event.preventDefault();
  productSuccess?.classList.remove("show");
  productError?.classList.remove("show");

  try {
    const data = formToObject(productForm);
    const product = selectedProduct.value;
    if (!allowedProducts.has(product)) throw new Error("Please select a valid program.");

    data.product = product;
    const leadId = await saveLead(data, "product-form");

    productSuccess.textContent =
      `Thank you. Your ${product} enquiry has been submitted successfully. Reference: SOE-${leadId.slice(0,8).toUpperCase()}`;
    productSuccess.classList.add("show");

    productForm.reset();
    selectedProduct.value = product;
  } catch (err) {
    console.error(err);
    productError.textContent =
      "We could not submit your enquiry. Please try again. If the problem continues, contact Select Overseas.";
    productError.classList.add("show");
  }
}

async function submitQuickForm(event) {
  event.preventDefault();
  quickSuccess?.classList.remove("show");
  quickError?.classList.remove("show");

  try {
    const data = formToObject(quickForm);
    const leadId = await saveLead(data, "quick-form");

    quickSuccess.textContent =
      `Thank you. Your assessment request has been submitted successfully. Reference: SOE-${leadId.slice(0,8).toUpperCase()}`;
    quickSuccess.classList.add("show");
    quickForm.reset();
  } catch (err) {
    console.error(err);
    quickError.textContent =
      "We could not submit your assessment request. Please try again or contact Select Overseas.";
    quickError.classList.add("show");
  }
}

productForm?.addEventListener("submit", submitProductForm);
quickForm?.addEventListener("submit", submitQuickForm);

// Reveal animation from the original website.
const revealItems = document.querySelectorAll(".program-card,.step,.benefit,.about-panel,.product-detail");
if ("IntersectionObserver" in window) {
  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.style.opacity = "1";
        entry.target.style.transform = "translateY(0)";
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.08 });

  revealItems.forEach(item => {
    item.style.opacity = "0";
    item.style.transform = "translateY(18px)";
    item.style.transition = "opacity .6s ease, transform .6s ease";
    observer.observe(item);
  });
}
