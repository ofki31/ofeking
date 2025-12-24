const form = document.getElementById("registerForm");
const submitBtn = document.getElementById("registerSubmit");
const togglePassword = document.getElementById("togglePassword");
const toggleConfirmPassword = document.getElementById("toggleConfirmPassword");
const passwordInput = document.getElementById("password");
const confirmPasswordInput = document.getElementById("confirmPassword");
const strengthBar = document.getElementById("strengthBar");
const strengthText = document.getElementById("strengthText");
const passwordRules = document.querySelectorAll("#passwordRules li");
const formAlert = document.getElementById("formAlert");

const fieldMap = {
  name: document.getElementById("name"),
  role: document.getElementById("role"),
  email: document.getElementById("email"),
  password: passwordInput,
  confirmPassword: confirmPasswordInput
};

const errorMap = {
  name: document.getElementById("nameError"),
  role: document.getElementById("roleError"),
  email: document.getElementById("emailError"),
  password: document.getElementById("passwordError"),
  confirmPassword: document.getElementById("confirmPasswordError")
};

const originalBtnContent = submitBtn.innerHTML;

togglePassword.addEventListener("click", () => toggleVisibility(passwordInput, togglePassword));
toggleConfirmPassword.addEventListener("click", () => toggleVisibility(confirmPasswordInput, toggleConfirmPassword));

passwordInput.addEventListener("input", updatePasswordIndicators);
confirmPasswordInput.addEventListener("input", () => {
  if (confirmPasswordInput.value.length) {
    comparePasswords();
  } else {
    errorMap.confirmPassword.textContent = "";
  }
});

form.addEventListener("input", () => {
  if (!formAlert.classList.contains("hidden")) {
    formAlert.classList.add("hidden");
  }
});

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  clearErrors();

  const validationErrors = validateForm();

  if (validationErrors.length) {
    validationErrors.forEach(({ field, message }) => setError(field, message));
    showAlert("error", "אנא השלם/י את הפרטים החסרים.");
    return;
  }

  setLoadingState(true);

  const payload = {
    name: fieldMap.name.value.trim(),
    email: fieldMap.email.value.trim(),
    password: fieldMap.password.value,
    role: fieldMap.role.value
  };

  try {
    const response = await fetch("http://localhost:3000/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "אירעה שגיאה בעת יצירת החשבון");
    }

    showAlert("success", "נרשמת בהצלחה! מעביר לדף ההתחברות...");
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> מפנה אותך';

    setTimeout(() => {
      window.location.href = "login.html";
    }, 2000);
  } catch (error) {
    console.error("Registration error:", error);
    showAlert("error", error.message);
    setLoadingState(false);
  }
});

function toggleVisibility(input, button) {
  const isPassword = input.getAttribute("type") === "password";
  input.setAttribute("type", isPassword ? "text" : "password");
  const icon = button.querySelector("i");
  icon.classList.toggle("fa-eye-slash", isPassword);
  icon.classList.toggle("fa-eye", !isPassword);
}

function updatePasswordIndicators() {
  const password = passwordInput.value;
  const strength = getPasswordStrength(password);

  strengthBar.className = "strength-bar";

  if (!password.length) {
    strengthBar.style.width = "0";
    strengthText.textContent = "חוזק סיסמה";
  } else {
    strengthBar.classList.add(`strength-${strength.level}`);
    strengthText.textContent = strength.label;
  }

  passwordRules.forEach((rule) => {
    const ruleKey = rule.getAttribute("data-rule");
    rule.classList.toggle("valid", strength.rules[ruleKey]);
  });

  comparePasswords();
}

function getPasswordStrength(password) {
  const rules = {
    length: password.length >= 8,
    case: /[A-Z]/.test(password) && /[a-z]/.test(password),
    number: /\d/.test(password),
    symbol: /[!@#$%^&*(),.?":{}|<>]/.test(password)
  };

  const passedRules = Object.values(rules).filter(Boolean).length;
  let level = "weak";
  let label = "חלשה";

  if (passedRules >= 3 && rules.length) {
    level = "medium";
    label = "בינונית";
  }
  if (passedRules === 4) {
    level = "strong";
    label = "חזקה";
  }

  return { level, label, rules };
}

function comparePasswords() {
  if (!confirmPasswordInput.value.length) {
    errorMap.confirmPassword.textContent = "";
    return;
  }
  if (passwordInput.value !== confirmPasswordInput.value) {
    setError("confirmPassword", "הסיסמאות אינן תואמות");
  } else {
    errorMap.confirmPassword.textContent = "";
  }
}

function validateForm() {
  const errors = [];
  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  if (fieldMap.name.value.trim().length < 2) {
    errors.push({ field: "name", message: "יש להזין שם מלא" });
  }

  if (!fieldMap.role.value) {
    errors.push({ field: "role", message: "בחר/י תפקיד" });
  }

  if (!emailPattern.test(fieldMap.email.value.trim())) {
    errors.push({ field: "email", message: "כתובת אימייל לא תקינה" });
  }

  const strength = getPasswordStrength(passwordInput.value);
  if (strength.level === "weak") {
    errors.push({ field: "password", message: "הסיסמה אינה עומדת בדרישות" });
  }

  if (passwordInput.value !== confirmPasswordInput.value) {
    errors.push({ field: "confirmPassword", message: "הסיסמאות אינן תואמות" });
  }

  if (!document.getElementById("terms").checked) {
    errors.push({ field: "terms", message: "יש לאשר את תנאי השימוש" });
  }

  return errors;
}

function setError(field, message) {
  const errorElement = errorMap[field];
  if (errorElement) {
    errorElement.textContent = message;
  } else if (field === "terms") {
    showAlert("error", message);
  }
}

function clearErrors() {
  Object.values(errorMap).forEach((element) => {
    if (element) element.textContent = "";
  });
}

function showAlert(type, message) {
  formAlert.className = `form-alert ${type}`;
  formAlert.innerHTML = `<i class="fas fa-info-circle"></i>${message}`;
  formAlert.classList.remove("hidden");
}

function setLoadingState(isLoading) {
  submitBtn.disabled = isLoading;
  submitBtn.innerHTML = isLoading
    ? '<i class="fas fa-spinner fa-spin"></i> יוצר חשבון...'
    : originalBtnContent;
}