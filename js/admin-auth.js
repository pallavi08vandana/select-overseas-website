import {
    signInWithEmailAndPassword
} from "https://www.gstatic.com/firebasejs/12.16.0/firebase-auth.js";

import { auth } from "./firebase-init.js";


const loginForm = document.getElementById("adminLoginForm");
const emailInput = document.getElementById("email");
const passwordInput = document.getElementById("password");
const loginButton = document.getElementById("loginButton");
const loginError = document.getElementById("loginError");


function showError(message) {

    loginError.textContent = message;
    loginError.style.display = "block";

}


function clearError() {

    loginError.textContent = "";
    loginError.style.display = "none";

}


loginForm.addEventListener("submit", async (event) => {

    event.preventDefault();

    clearError();

    const email = emailInput.value.trim();
    const password = passwordInput.value;


    if (!email || !password) {

        showError("Please enter your email address and password.");

        return;

    }


    loginButton.disabled = true;
    loginButton.textContent = "Signing in...";


    try {

        console.log("Starting Firebase login...");
        console.log("Email:", email);


        const result =
            await signInWithEmailAndPassword(
                auth,
                email,
                password
            );


        const user = result.user;


        console.log("================================");
        console.log("LOGIN SUCCESS");
        console.log("Email:", user.email);
        console.log("UID:", user.uid);
        console.log("================================");


        /*
         * IMPORTANT:
         *
         * We DO NOT read Firestore here.
         *
         * Firebase Authentication has already
         * confirmed the email/password.
         *
         * The management profile will be checked
         * inside dashboard.html.
         */


        window.location.href = "./dashboard.html";


    } catch (error) {

        console.error("Firebase Login Error:", error);


        let message = "Unable to sign in.";


        switch (error.code) {

            case "auth/invalid-credential":

                message =
                    "Incorrect email or password.";

                break;


            case "auth/user-not-found":

                message =
                    "No account exists with this email address.";

                break;


            case "auth/wrong-password":

                message =
                    "Incorrect password.";

                break;


            case "auth/invalid-email":

                message =
                    "Please enter a valid email address.";

                break;


            case "auth/too-many-requests":

                message =
                    "Too many login attempts. Please try again later.";

                break;


            case "auth/network-request-failed":

                message =
                    "Network error. Please check your internet connection.";

                break;


            default:

                message =
                    error.message || "Login failed.";

        }


        showError(message);


        loginButton.disabled = false;
        loginButton.textContent = "Sign In";

    }

});