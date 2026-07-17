import React from "react";

const UserImageAttachment = ({ src, onClick }) => {
  return (
    <img
      src={src}
      alt="Attached"
      onClick={onClick}
      className="max-w-[220px] max-h-[160px] object-contain rounded-lg select-none cursor-pointer flex-shrink-0"
    />
  );
};

export default UserImageAttachment;
