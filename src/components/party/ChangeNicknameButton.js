import React, { useState } from "react";
import { IconButton } from "theme-ui";

import ChangeNicknameModal from "../../modals/ChangeNicknameModal";
import ChangeNicknameIcon from "../../icons/ChangeNicknameIcon";

function ChangeNicknameButton({ nickname, onChange }) {
  const [isChangeModalOpen, setIsChangeModalOpen] = useState(false);
  function openModal() {
    setIsChangeModalOpen(true);
  }
  function closeModal() {
    setIsChangeModalOpen(false);
  }

  const [changedNickname, setChangedNickname] = useState(nickname);
  function handleChangeSubmit(event) {
    event.preventDefault();
    onChange(changedNickname);
    closeModal();
  }

  function handleChange(event) {
    setChangedNickname(event.target.value);
  }
  return (
    <>
      <IconButton
        m={1}
        aria-label="Change Nickname"
        title="Change Nickname"
        onClick={openModal}
      >
        <ChangeNicknameIcon />
      </IconButton>
      <ChangeNicknameModal
        isOpen={isChangeModalOpen}
        onRequestClose={closeModal}
        onChangeSubmit={handleChangeSubmit}
        onChange={handleChange}
        nickname={changedNickname}
      />
    </>
  );
}

export default ChangeNicknameButton;
