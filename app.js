// Blush & Bloom — mobile menu + WhatsApp booking
(function () {
  var menuBtn = document.getElementById("menuBtn");
  var nav = document.getElementById("mainNav");
  if (menuBtn && nav) {
    menuBtn.addEventListener("click", function () {
      nav.classList.toggle("open");
    });
    nav.querySelectorAll("a").forEach(function (link) {
      link.addEventListener("click", function () {
        nav.classList.remove("open");
      });
    });
  }

  var form = document.getElementById("bookForm");
  if (form) {
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var name = document.getElementById("bkName").value.trim();
      var service = document.getElementById("bkService").value;
      var date = document.getElementById("bkDate").value;
      var note = document.getElementById("bkNote").value.trim();
      var msg = "Hi Blush & Bloom, I want to book an appointment.";
      if (name) msg += " My name is " + name + ".";
      msg += " Service: " + service + ".";
      if (date) msg += " Preferred day: " + date + ".";
      if (note) msg += " Note: " + note;
      window.open("https://wa.me/918292160777?text=" + encodeURIComponent(msg), "_blank");
    });
  }
})();
