function formValidation(e) {
  e.preventDefault(); // prevent default form submission

  const username = document.getElementById("username");
  const email = document.getElementById("email");
  const password = document.getElementById("password");
  const confirmPassword = document.getElementById("confirm-password");
  const agreeCheckBox = document.getElementById("agree-checkbox");

  if (username.value.length < 8) {
    alert("Username must contain more than 8 characters!");
  } else if (!email.value.endsWith("@gmail.com")) {
    alert("Email must end with '@gmail.com'");
  } else if (password.value.length === 0) {
    alert("Password must be filled!");
  } else if (confirmPassword.value !== password.value) {
    alert("Confirm password must match the password");
  } else if (!agreeCheckBox.checked) {
    alert("Please agree to the terms and conditions");
  } else {
    alert("Your account has been successfully registered!");
    window.location.href = "home.html";
  }
}

export default formValidation;
