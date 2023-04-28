import { useEffect } from "react";
import { useToasts } from "react-toast-notifications";
import { Link } from "theme-ui";

export function MigrationNotification() {
  const { addToast } = useToasts();

  useEffect(() => {
    const message = (
      <span>
        The new era of Owlbear Rodeo is coming on July 18th. Make sure to
        migrate your data before July 18th. <Link href="#">Read more</Link>
      </span>
    );
    addToast(message, {
      autoDismiss: false,
      appearance: "info",
    });
  }, [addToast]);

  return null;
}
