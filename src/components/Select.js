import React from "react";
import ReactSelect from "react-select";
import Creatable from "react-select/creatable";
import { useThemeUI } from "theme-ui";

function Select({ creatable, ...props }) {
  const { theme } = useThemeUI();

  const Component = creatable ? Creatable : ReactSelect;

  return (
    <Component
      styles={{
        menu: (provided, state) => ({
          ...provided,
          backgroundColor: theme.colors.background,
          color: theme.colors.text,
          borderRadius: "4px",
          borderColor: theme.colors.gray,
          borderStyle: "solid",
          borderWidth: "1px",
          fontFamily: theme.fonts.body2,
          opacity: state.isDisabled ? 0.5 : 1,
        }),
        control: (provided, state) => ({
          ...provided,
          backgroundColor: "transparent",
          color: theme.colors.text,
          borderColor: theme.colors.text,
          opacity: state.isDisabled ? 0.5 : 1,
        }),
        singleValue: (provided) => ({
          ...provided,
          color: theme.colors.text,
          fontFamily: theme.fonts.body2,
        }),
        option: (provided, state) => ({
          ...provided,
          color: theme.colors.text,
          opacity: state.isDisabled ? 0.5 : 1,
        }),
        dropdownIndicator: (provided, state) => ({
          ...provided,
          color: theme.colors.text,
          ":hover": {
            color: state.isDisabled
              ? theme.colors.disabled
              : theme.colors.primary,
          },
        }),
        input: (provided, state) => ({
          ...provided,
          color: theme.colors.text,
          opacity: state.isDisabled ? 0.5 : 1,
        }),
        container: (provided) => ({
          ...provided,
          margin: "4px 0",
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
