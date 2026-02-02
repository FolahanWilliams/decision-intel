import { SignUp } from "@clerk/nextjs";

export default function SignUpPage() {
    return (
        <div className="container flex items-center justify-center" style={{ minHeight: '100vh' }}>
            <SignUp />
        </div>
    );
}
