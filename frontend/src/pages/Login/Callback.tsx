import { handleOAuthCallback } from "../../api/login";
import Loader from "../../components/Loader/Loader";

function Callback() {
  handleOAuthCallback();
  return <Loader />;
}

export default Callback;
