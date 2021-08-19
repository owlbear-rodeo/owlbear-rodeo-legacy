import TextareaAutosize, {
  TextareaAutosizeProps,
} from "react-textarea-autosize";
import "./TextareaAutoSize.css";

function StyledTextareaAutoSize(props: TextareaAutosizeProps) {
  return <TextareaAutosize className="textarea-auto-size" {...props} />;
}

export default StyledTextareaAutoSize;
