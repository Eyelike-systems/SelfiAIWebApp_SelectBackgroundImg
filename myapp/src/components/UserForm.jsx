import React from "react";

const UserForm = ({
  formRef,
  submitBtnRef,
  onChange,
  onSubmit,
  isFormComplete,
  loading,
  errorMessage,
}) => (
  <form ref={formRef} onChange={onChange} onSubmit={onSubmit}>
    <input name="fname" placeholder="Name" required />
    <input name="mno" type="number" placeholder="Mobile" required maxLength="10" pattern="[0-9]{10}" />
    <select name="order_amount" defaultValue="21">
      <option value="1">1</option>
      <option value="21">21</option>
      <option value="51">51</option>
      <option value="101">101</option>
    </select>
    {loading && <div className="loader" />}
    <input
      ref={submitBtnRef}
      className="registerBtn"
      type="submit"
      value="Donate / देणगी"
      disabled={!isFormComplete}
      style={{
        backgroundColor: isFormComplete ? "green" : "gray",
        color: "white",
        padding: "10px 20px",
        cursor: isFormComplete ? "pointer" : "not-allowed",
      }}
    />
    {errorMessage && <div style={{ color: "red" }}>{errorMessage}</div>}
  </form>
);

export default UserForm;
