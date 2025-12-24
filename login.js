const form = document.getElementById("loginForm");
const submitBtn = document.getElementById("loginSubmit");
const togglePassword = document.getElementById("togglePassword");
const passwordInput = document.getElementById("password");
const rememberCheckbox = document.getElementById("remember");
const formAlert = document.getElementById("formAlert");
const resetLink = document.getElementById("resetLink");

const emailField = document.getElementById("email");
const fieldErrors = {
  email: document.getElementById("emailError"),
  password: document.getElementById("passwordError")
};

const originalBtnContent = submitBtn.innerHTML;

togglePassword.addEventListener("click", () => {
  const isPassword = passwordInput.getAttribute("type") === "password";
  passwordInput.setAttribute("type", isPassword ? "text" : "password");
  const icon = togglePassword.querySelector("i");
  icon.classList.toggle("fa-eye-slash", isPassword);
  icon.classList.toggle("fa-eye", !isPassword);
});

resetLink.addEventListener("click", () => {
  showAlert("neutral", "שלחנו הוראות איפוס לדוא\"ל אם קיים במערכת.");
});

prefillRememberedEmail();

form.addEventListener("input", () => {
  if (formAlert && !formAlert.classList.contains("hidden")) {
    formAlert.classList.add("hidden");
  }
});

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  clearErrors();

  const { email, password } = getFormValues();
  const validationErrors = validateFields(email, password);

  if (validationErrors.length) {
    validationErrors.forEach(({ field, message }) => setFieldError(field, message));
    showAlert("error", "בדוק את השדות האדומים ונסה שוב.");
    return;
  }

  setLoadingState(true);

  try {
    const response = await fetch("http://localhost:3000/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email,
        password,
        remember: rememberCheckbox.checked
      })
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "פרטי ההתחברות שגויים");
    }

    localStorage.setItem("user", JSON.stringify(data.user));

    if (rememberCheckbox.checked) {
      localStorage.setItem("rememberedEmail", email);
    } else {
      localStorage.removeItem("rememberedEmail");
    }

    showAlert("success", "מתחברים ללוח הבקרה שלך...");
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> טוען נתונים';

    setTimeout(() => {
      window.location.href = data.user?.isAdmin ? "admin.html" : "home.html";
    }, 1000);
  } catch (error) {
    console.error("Login error:", error);
    showAlert("error", error.message || "אירעה שגיאה בהתחברות");
    setLoadingState(false);
  }
});

function getFormValues() {
  return {
    email: emailField.value.trim(),
    password: passwordInput.value
  };
}

function validateFields(email, password) {
  const errors = [];
  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  if (!emailPattern.test(email)) {
    errors.push({ field: "email", message: "נא להזין כתובת אימייל תקינה" });
  }

  if (password.length < 6) {
    errors.push({ field: "password", message: "הסיסמה חייבת לכלול 6 תווים לפחות" });
  }

  return errors;
}

function setFieldError(field, message) {
  const errorElement = fieldErrors[field];
  if (errorElement) {
    errorElement.textContent = message;
  }
}

function clearErrors() {
  Object.values(fieldErrors).forEach((element) => {
    element.textContent = "";
  });
}

function showAlert(type, message) {
  if (!formAlert) return;
  formAlert.className = `form-alert ${type}`;
  formAlert.innerHTML = `<i class="fas fa-info-circle"></i>${message}`;
  formAlert.classList.remove("hidden");
}

function setLoadingState(isLoading) {
  submitBtn.disabled = isLoading;
  submitBtn.innerHTML = isLoading
    ? '<i class="fas fa-spinner fa-spin"></i> מתחבר...'
    : originalBtnContent;
}

function prefillRememberedEmail() {
  const storedEmail = localStorage.getItem("rememberedEmail");
  if (storedEmail) {
    emailField.value = storedEmail;
    rememberCheckbox.checked = true;
  }
}