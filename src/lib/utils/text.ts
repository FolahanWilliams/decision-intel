export function sanitizeInput(text: string): string {
    if (!text) return "";
    // Remove the specific closing tag used in prompts to prevent injection
    // Also remove opening tag just in case
    return text.replace(/<\/?input_text>/g, "");
}
