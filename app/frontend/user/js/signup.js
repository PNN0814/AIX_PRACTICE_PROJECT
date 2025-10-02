// 내 정보 수정 버튼 클릭 시
document.getElementById("formData").addEventListener("submit", function(e) {
  e.preventDefault(); // 기본 submit 막기

  // 값 검증
  if(document.getElementById("user_id").value == ""){
    alert("아이디를 입력해주세요.");
    document.getElementById("user_id").focus();
    return;
  } else if (document.getElementById("user_email").value == "") {
    alert("이메일을 입력해주세요.");
    document.getElementById("user_email").focus();
    return;
  } else if (document.getElementById("user_addr1").value == "") {
    alert("주소1을 입력해주세요.");
    document.getElementById("user_addr1").focus();
    return;
  } else if (document.getElementById("user_post").value == "") {
    alert("우편번호를 입력해주세요.");
    document.getElementById("user_post").focus();
    return;
  } else if (document.getElementById("user_birth").value == "") {
    alert("생년월일을 입력해주세요.");
    document.getElementById("user_birth").focus();
    return;
  } else if(document.getElementById("user_pw").value == ""){
    alert("비밀번호를 입력해주세요.");
    document.getElementById("user_pw").focus();
    return;
  }

  // FormData 객체 생성
  const form = document.getElementById("formData");
  const formData = new FormData(form);

  // fetch PUT 요청
  fetch("/userCreate", {
    method: "POST",
    body: formData
  })
  .then(res => res.json())
  .then(data => {
    if (data.success) {
      alert(data.message);   // 회원가입이 완료 되었습니다!
      window.location.href = "/"; // 수정 완료 후 이동
    }
  })
  .catch(err => {
    alert("에러 발생: " + err.message);
  });
});