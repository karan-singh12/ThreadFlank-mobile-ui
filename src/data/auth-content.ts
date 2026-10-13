// Copy for the authentication pages. Components read only from here.

export const authContent = {
  backToHome: "Back to home",
  legal: { terms: "Terms", privacy: "Disclaimer" },

  showcase: {
    eyebrow: "Virtual try-on",
    title: ["See it on", "you first"],
    description: "One selfie, your wardrobe and your circle — try on anything from any store before you buy.",
    pills: ["Photo-real drape", "Any store link", "Twin circle"],
    testimonial: {
      quote: "I stopped ordering three sizes and returning two. Seeing the drape on my own twin is scarily close to the real thing.",
      name: "Maya",
      handle: "@maya.wears",
      image: "/images/people/maya.jpg",
      tone: "slate",
    },
  },

  login: {
    title: "Welcome back",
    description: "Log in to continue building with your AI workspace.",
    email: { label: "Email", placeholder: "name@company.com" },
    password: { label: "Password", placeholder: "Enter your password" },
    forgot: "Forgot password?",
    submit: "Log in",
    submitting: "Logging in…",
    invalidCredentials: "That email and password combination doesn't match our records.",
    switchPrompt: "Don't have an account?",
    switchAction: "Sign up",
  },

  signup: {
    title: "Create your account",
    description: "Start free — no credit card required.",
    planPrefix: "Selected plan",
    username: { label: "Username", placeholder: "yourname", hint: "3–30 characters. Letters, numbers, dots and underscores." },
    email: { label: "Work email", placeholder: "name@company.com" },
    password: { label: "Password", placeholder: "Create a password", hint: "At least 8 characters with a letter and a number." },
    confirmPassword: { label: "Confirm password", placeholder: "Repeat your password" },
    terms: { prefix: "I agree to the", terms: "Terms & conditions", and: "have read the", privacy: "Disclaimer" },
    submit: "Create account",
    submitting: "Creating account…",
    switchPrompt: "Already have an account?",
    switchAction: "Log in",
  },

  forgotPassword: {
    title: "Reset your password",
    description: "Enter the email you signed up with and we'll send you a link to reset your password.",
    email: { label: "Email", placeholder: "name@company.com" },
    submit: "Send reset link",
    submitting: "Sending…",
    sentTitle: "Check your inbox",
    sentDescription: "If an account exists for {email}, a password reset link is on its way. The link expires in 30 minutes.",
    resend: "Use a different email",
    back: "Back to log in",
  },

  resetPassword: {
    title: "Choose a new password",
    description: "Pick a strong password you haven't used before.",
    password: { label: "New password", placeholder: "Create a password", hint: "At least 8 characters with a letter and a number." },
    confirmPassword: { label: "Confirm new password", placeholder: "Repeat your password" },
    submit: "Update password",
    submitting: "Updating…",
    invalidLink: "This reset link is invalid or has expired. Request a new one to continue.",
    requestNew: "Request a new link",
    doneTitle: "Password updated",
    doneDescription: "Your password has been changed. You can now log in with your new password.",
    back: "Back to log in",
  },
};
