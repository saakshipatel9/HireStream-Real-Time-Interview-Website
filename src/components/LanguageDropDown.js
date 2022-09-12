import React from "react";
import Select from "react-select";
import { languageOptions } from "../constants/languageOptions";

function LanguageDropDown({ onSelectChange, selectedOption }) {
  return (
    <Select
      placeholder={`Filter By Category`}
      options={languageOptions}
      value={selectedOption}
      onChange={(selectedOption) => onSelectChange(selectedOption)}
    />
  );
}

export default LanguageDropDown;
