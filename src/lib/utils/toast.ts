import { toast as showToast } from "sonner";

interface ToastOptions {
  title: string;
  description: string;
  variant?: "default" | "destructive" | "success";
}

export const toast = (options: ToastOptions) => {
  const { title, description, variant } = options;

  switch (variant) {
    case "success":
      showToast.success(title, {
        description,
        duration: 3000,
      });
      break;
    case "destructive":
      showToast.error(title, {
        description,
        duration: 3000,
      });
      break;
    default:
      showToast(title, {
        description,
        duration: 3000,
      });
  }
};
