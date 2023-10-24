function match() {
  const element = document.getElementById("match-letters");
  const input = element.getElementsByTagName("textarea")[0].value;
  const findChars = element.querySelector("#searchChars").value;
  console.log(`Input string: ${input}`);
  let output = "";
  const span_start = "<span class='highlight'>";
  const span_end = "</span>";
  for (const char of input) {
    if (findChars.indexOf(char) == -1) {
      output += char;
    } else {
      output += span_start;
      output += char;
      output += span_end;
    }
  }
  console.log(`Result string: ${output}`);
  const answer_el = element.getElementsByClassName("answer")[0];
  answer_el.style.display = "block";
  answer_el.innerHTML = output;
}
