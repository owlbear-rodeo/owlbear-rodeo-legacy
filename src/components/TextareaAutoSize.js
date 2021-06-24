import TextareaAutosize from "react-textarea-autosize";
import "./TextareaAutoSize.css";

function StyledTextareaAutoSize(props) {
  return <TextareaAutosize className="textarea-auto-size" {...props} />;
}

export default StyledTextareaAutoSize;
