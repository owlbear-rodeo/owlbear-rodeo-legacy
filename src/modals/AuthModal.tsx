import { useState, useRef, ChangeEvent, FormEvent } from "react";
import { Box, Input, Button, Label, Flex } from "theme-ui";

import { useAuth } from "../contexts/AuthContext";

import Modal from "../components/Modal";

type AuthModalProps = {
  isOpen: boolean;
  onSubmit: (newPassword: string) => void;
};

function AuthModal({ isOpen, onSubmit }: AuthModalProps) {
  const { password, setPassword } = useAuth();
  const [tmpPassword, setTempPassword] = useState<string>(password);

  function handleChange(event: ChangeEvent<HTMLInputElement>): void {
    setTempPassword(event.target?.value);
  }

  function handleSubmit(event: FormEvent<HTMLElement>): void {
    event.preventDefault();
    setPassword(tmpPassword);
    onSubmit(tmpPassword);
  }

  const inputRef = useRef<HTMLInputElement>(null);
  function focusInput(): void {
    inputRef.current && inputRef.current?.focus();
  }

  return (
    <Modal isOpen={isOpen} allowClose={false} onAfterOpen={focusInput}>
      <Box as="form" onSubmit={handleSubmit}>
        <Label py={2} htmlFor="password">
          Enter password
        </Label>
        <Input
          id="password"
          value={tmpPassword}
          onChange={handleChange}
          ref={inputRef}
          autoComplete="off"
        />
        <Flex py={2}>
          <Button sx={{ flexGrow: 1 }}>Join</Button>
        </Flex>
      </Box>
    </Modal>
  );
}

export default AuthModal;
