import gsap from "gsap";

export const startAnimation = () => {
  gsap.set("#container", { perspective: 600 });
  gsap.set("img", { xPercent: "-50%", yPercent: "-50%" });

  const total = 30;
  const warp = document.getElementById("container");
  const w = window.innerWidth;
  const h = window.innerHeight;

  for (let i = 0; i < total; i++) {
    const Div = document.createElement("div");
    gsap.set(Div, {
      attr: { class: "dot" },
      x: R(0, w),
      y: R(-200, -150),
      z: R(-200, 200),
    });
    warp.appendChild(Div);
    animateDot(Div, h);
  }
};

export const stopAnimation = () => {
  gsap.killTweensOf("#container .dot");
  const dots = document.querySelectorAll("#container .dot");
  dots.forEach((dot) => dot.remove());
};

const animateDot = (elm, h) => {
  gsap.to(elm, R(6, 15), {
    y: h + 100,
    ease: "none",
    repeat: -1,
    delay: -15,
  });
  gsap.to(elm, R(4, 8), {
    x: "+=100",
    rotationZ: R(0, 180),
    repeat: -1,
    yoyo: true,
    ease: "sine.inOut",
  });
  gsap.to(elm, R(2, 8), {
    rotationX: R(0, 360),
    rotationY: R(0, 360),
    repeat: -1,
    yoyo: true,
    ease: "sine.inOut",
    delay: -5,
  });
};

const R = (min, max) => min + Math.random() * (max - min);
