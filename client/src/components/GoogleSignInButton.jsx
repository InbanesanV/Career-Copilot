import { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import apiClient from "../api/client.js";
import { useAuth } from "../context/AuthContext.jsx";

const CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;

// Module-level flag so GIS initialize() is only called once across React StrictMode remounts
let gsiInitialized = false;

/**
 * GoogleSignInButton — renders the official Google "Sign in with Google" button.
 *
 * Uses Google Identity Services (GIS) loaded via the <script> tag in index.html.
 * On credential received:
 *   - POSTs idToken to /api/auth/google
 *   - If requiresProfileCompletion → navigate to /auth/complete-profile
 *   - If token returned → call login() + navigate to /
 *
 * @param {{ text?: "signin_with" | "signup_with" | "continue_with" }} props
 */
export default function GoogleSignInButton({ text = "signin_with" }) {
  const divRef = useRef(null);
  const navigate = useNavigate();
  const { login } = useAuth();

  useEffect(() => {
    // GIS is loaded async — wait for it to be available.
    if (!window.google || !CLIENT_ID) return;

    if (!gsiInitialized) {
      window.google.accounts.id.initialize({
        client_id: CLIENT_ID,
        callback: handleCredentialResponse,
      });
      gsiInitialized = true;
    }

    if (divRef.current) {
      divRef.current.innerHTML = "";
      window.google.accounts.id.renderButton(divRef.current, {
        theme: "filled_black",
        size: "large",
        shape: "rectangular",
        text,
        width: 320,
      });
    }
  }, [text]);

  async function handleCredentialResponse(response) {
    try {
      const res = await apiClient.post("/api/auth/google", {
        idToken: response.credential,
      });

      if (res.data.requiresProfileCompletion) {
        // New Google user — needs to provide register number + college name
        navigate("/auth/complete-profile", {
          state: {
            googleId: res.data.googleId,
            suggestedUserName: res.data.suggestedUserName,
            email: res.data.email,
          },
        });
      } else {
        // Existing Google user — JWT issued immediately
        login(res.data.token, res.data.user.userName);
        navigate("/");
      }
    } catch (err) {
      // Surface error to parent via a custom event so Login/Register pages
      // can show it in their error banner without prop drilling.
      window.dispatchEvent(
        new CustomEvent("google-auth-error", {
          detail: err.message || "Google sign-in failed. Please try again.",
        })
      );
    }
  }

  if (!CLIENT_ID) {
    // VITE_GOOGLE_CLIENT_ID not set — hide the button gracefully
    return null;
  }

  return (
    <div className="flex justify-center">
      <div ref={divRef} />
    </div>
  );
}
