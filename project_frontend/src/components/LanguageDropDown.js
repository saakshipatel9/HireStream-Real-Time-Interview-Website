import React from "react";
import Select from "react-select";
import { languageOptions } from "../constants/languageOptions";

function LanguageDropDown({ onSelectChange }) {
  return (
    <Select
      placeholder={`Filter By Category`}
      options={languageOptions}
      //   styles={{}}
      defaultValue={languageOptions[0]}
      onChange={(selectedOption) => onSelectChange(selectedOption)}
    />
  );
}

export default LanguageDropDown;
