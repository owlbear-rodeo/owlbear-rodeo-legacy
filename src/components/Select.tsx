import ReactSelect, { Props } from "react-select";
import Creatable from "react-select/creatable";
import { useThemeUI } from "theme-ui";

type SelectProps = {
  creatable?: boolean;
} & Props;

function Select({ creatable, ...props }: SelectProps) {
  const { theme } = useThemeUI();

  const Component: any = creatable ? Creatable : ReactSelect;

  return (
    <Component
      styles={{
        menu: (provided: any, state: any) => ({
          ...provided,
          backgroundColor: theme.colors?.background,
          color: theme.colors?.text,
          borderRadius: "4px",
          borderColor: theme.colors?.gray,
          borderStyle: "solid",
          borderWidth: "1px",
          fontFamily: (theme.fonts as any)?.body2,
          opacity: state.isDisabled ? 0.5 : 1,
        }),
        control: (provided: any, state: any) => ({
          ...provided,
          backgroundColor: "transparent",
          color: theme.colors?.text,
          borderColor: theme.colors?.text,
          opacity: state.isDisabled ? 0.5 : 1,
        }),
        singleValue: (provided: any) => ({
          ...provided,
          color: theme.colors?.text,
          fontFamily: (theme.fonts as any).body2,
        }),
        option: (provided: any, state: any) => ({
          ...provided,
          color: theme.colors?.text,
          opacity: state.isDisabled ? 0.5 : 1,
        }),
        dropdownIndicator: (provided: any, state: any) => ({
          ...provided,
          color: theme.colors?.text,
          ":hover": {
            color: state.isDisabled
              ? theme.colors?.disabled
              : theme.colors?.primary,
          },
        }),
        input: (provided: any, state: any) => ({
          ...provided,
          color: theme.colors?.text,
          opacity: state.isDisabled ? 0.5 : 1,
        }),
        container: (provided: any) => ({
          ...provided,
          margin: "4px 0",
        }),
      }}
      theme={(t: any) => ({
        ...t,
        colors: {
          ...t.colors,
          primary: theme.colors?.primary,
          primary50: theme.colors?.secondary,
          primary25: theme.colors?.highlight,
        },
      })}
      captureMenuScroll={false}
      {...props}
    />
  );
}

Select.defaultProps = {
  creatable: false,
};

export default Select;
