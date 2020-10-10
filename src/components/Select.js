import React from "react";
import ReactSelect from "react-select";
import Creatable from "react-select/creatable";
import { useThemeUI } from "theme-ui";

function Select({ creatable, ...props }) {
  const { theme } = useThemeUI();

  function getColor(state) {
    return state.isDisabled ? theme.colors.gray : theme.colors.text;
  }

  const Component = creatable ? Creatable : ReactSelect;

  return (
    <Component
      styles={{
        menu: (provided, state) => ({
          ...provided,
          backgroundColor: theme.colors.background,
          color: getColor(state),
          borderRadius: "4px",
          borderColor: theme.colors.gray,
          borderStyle: "solid",
          borderWidth: "1px",
          fontFamily: theme.fonts.body2,
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
          fontFamily: theme.fonts.body2,
        }),
        option: (provided, state) => ({
          ...provided,
          color: getColor(state),
          opacity: state.isDisabled ? 0.5 : 1,
        }),
        dropdownIndicator: (provided, state) => ({
          ...provided,
          color: getColor(state),
          ":hover": {
            color: state.isDisabled
              ? theme.colors.disabled
              : theme.colors.primary,
          },
        }),
        input: (provided, state) => ({
          ...provided,
          color: getColor(state),
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
