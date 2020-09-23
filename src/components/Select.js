import React from "react";
import ReactSelect from "react-select";
import { useThemeUI } from "theme-ui";

function Select(props) {
  const { theme } = useThemeUI();

  function getColor(state) {
    return state.isDisabled ? theme.colors.gray : theme.colors.text;
  }

  return (
    <ReactSelect
      isSearchable={false}
      styles={{
        menu: (provided, state) => ({
          ...provided,
          backgroundColor: theme.colors.background,
          color: getColor(state),
          borderRadius: "4px",
          borderColor: theme.colors.gray,
          borderStyle: "solid",
          borderWidth: "1px",
        }),
        control: (provided, state) => ({
          ...provided,
          backgroundColor: theme.colors.background,
          color: getColor(state),
          borderColor: theme.colors.text,
        }),
        singleValue: (provided, state) => ({
          ...provided,
          color: getColor(state),
        }),
        dropdownIndicator: (provided, state) => ({
          ...provided,
          color: getColor(state),
          ":hover": {
            color: state.isDisabled ? theme.colors.gray : theme.colors.primary,
          },
        }),
      }}
      theme={(t) => ({
        ...t,
        colors: {
          ...t.colors,
          primary: theme.colors.primary,
          primary50: theme.colors.secondary,
          primary25: theme.colors.highlight,
        },
      })}
      {...props}
    />
  );
}

export default Select;
