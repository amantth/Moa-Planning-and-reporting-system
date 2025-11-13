import { toast } from "sonner";

export function testToast() {
  console.log("Testing toast...");
  toast.success("Test toast is working!");
  toast.error("Test error toast!");
  toast.info("Test info toast!");
}

// Call this from browser console: window.testToast()
if (typeof window !== "undefined") {
  (window as any).testToast = testToast;
}
