Its an demo code for an darkmode toggle with clip path animation, dark / light mode switch. analyse the code carefully.fully understand the code. and implement this transition and effect when the darkmode toggle button is clicked. so do this in our project.

<!DOCTYPE html>
<!--Code By Webdevtrick ( https://webdevtrick.com )-->
<html lang="en" >
<head>
  <meta charset="UTF-8">
  <title>Clip Path Dark/Light Mode | Webdevtrick.com</title>
  <link href="https://fonts.googleapis.com/css?family=Big+Shoulders+Text&display=swap" rel="stylesheet">
  <link rel='stylesheet' href='https://cdnjs.cloudflare.com/ajax/libs/normalize/8.0.1/normalize.min.css'>
  <link rel='stylesheet' href='https://pro.fontawesome.com/releases/v5.10.2/css/all.css'>
  <link rel='stylesheet' href='style.css'>
</head>
<body>
 
<div id="container" class="container">
	<div class="header card">
		<div class="section-width">
			<div class="logotext">LOGO</div>
		</div>
	</div>
	<div class="content">
		<div class="page inner-card section-width">
			<div id="post1"></div>
			<h1>Heading 1<a href="#post1" class="fad fa-bolt"></a></h1>
			<p>Lorem ipsum dolor sit amet, consectetur adipiscing elit. Mauris vehicula quis lectus a tempor. Praesent lobortis mi eu finibus lacinia. Aenean lacinia ornare libero, vel congue nunc convallis dictum. Vestibulum aliquam tempus posuere. Nullam vitae tellus ligula.<br>
				 Maecenas sit amet tortor nec lacus vulputate suscipit. Aliquam placerat, urna in maximus placerat, lectus ex tempor odio, facilisis rutrum arcu sapien rutrum libero. Nunc vestibulum posuere elementum.<br>
				 Mauris ultricies vitae eros a vestibulum. Pellentesque auctor facilisis massa sit amet euismod. Quisque magna lacus,<br>
				 vulputate non risus vel, luctus luctus enim. Aenean fringilla sit amet ipsum in dapibus. Vivamus tristique diam ut tellus elementum gravida a vel arcu.</p>
		</div>
		<div class="page inner-card section-width">
			<div id="post2"></div>
			<h1>Heading 2<a href="#post2" class="fad fa-bolt"></a></h1>
			<p>Lorem ipsum dolor sit amet, consectetur adipiscing elit. Mauris vehicula quis lectus a tempor. Praesent lobortis mi eu finibus lacinia. Aenean lacinia ornare libero, vel congue nunc convallis dictum. Vestibulum aliquam tempus posuere. Nullam vitae tellus ligula.<br>
				Maecenas sit amet tortor nec lacus vulputate suscipit. Aliquam placerat, urna in maximus placerat, lectus ex tempor odio, facilisis rutrum arcu sapien rutrum libero. Nunc vestibulum posuere elementum.<br>
				Mauris ultricies vitae eros a vestibulum. Pellentesque auctor facilisis massa sit amet euismod. Quisque magna lacus,<br>
				vulputate non risus vel, luctus luctus enim. Aenean fringilla sit amet ipsum in dapibus. Vivamus tristique diam ut tellus elementum gravida a vel arcu.</p>
		</div>
		<div class="page inner-card section-width">
			<div id="post3"></div>
			<h1>Heading 3<a href="#post3" class="fad fa-bolt"></a></h1>
			<p>Lorem ipsum dolor sit amet, consectetur adipiscing elit. Mauris vehicula quis lectus a tempor. Praesent lobortis mi eu finibus lacinia. Aenean lacinia ornare libero, vel congue nunc convallis dictum. Vestibulum aliquam tempus posuere. Nullam vitae tellus ligula.<br>
				Maecenas sit amet tortor nec lacus vulputate suscipit. Aliquam placerat, urna in maximus placerat, lectus ex tempor odio, facilisis rutrum arcu sapien rutrum libero. Nunc vestibulum posuere elementum.<br>
				Mauris ultricies vitae eros a vestibulum. Pellentesque auctor facilisis massa sit amet euismod. Quisque magna lacus,<br>
				vulputate non risus vel, luctus luctus enim. Aenean fringilla sit amet ipsum in dapibus. Vivamus tristique diam ut tellus elementum gravida a vel arcu.</p>
		</div>
	</div>
	<div class="darkmode inner-card fas fa-moon-cloud"></div>
</div>
<div class="clip"></div>
 
<script src='https://cdnjs.cloudflare.com/ajax/libs/jquery/3.4.1/jquery.min.js'></script>
<script  src="function.js"></script>
 
</body>
</html>
style.css

Now create a CSS file named ‘style.css‘ and put these codes given here.

/* Code By Webdevtrick ( https://webdevtrick.com ) */
@charset "UTF-8";
body {
  font-family: 'Big Shoulders Text', cursive;
}
.clip {
  z-index: 2;
  position: fixed;
  bottom: 3rem;
  left: 3rem;
  width: 0rem;
  height: 0rem;
  border-radius: 100%;
}
.clip.anim {
  -webkit-animation: open 1.5s ease-in;
          animation: open 1.5s ease-in;
}
@-webkit-keyframes open {
  0% {
    bottom: 3rem;
    left: 3rem;
    width: 0rem;
    height: 0rem;
    -webkit-clip-path: circle(0rem at center);
            clip-path: circle(0rem at center);
  }
  100% {
    bottom: calc(-250vmax + 3rem);
    left: calc(-250vmax + 3rem);
    width: 500vmax;
    height: 500vmax;
    -webkit-clip-path: circle(100% at center);
            clip-path: circle(100% at center);
  }
}
@keyframes open {
  0% {
    bottom: 3rem;
    left: 3rem;
    width: 0rem;
    height: 0rem;
    -webkit-clip-path: circle(0rem at center);
            clip-path: circle(0rem at center);
  }
  100% {
    bottom: calc(-250vmax + 3rem);
    left: calc(-250vmax + 3rem);
    width: 500vmax;
    height: 500vmax;
    -webkit-clip-path: circle(100% at center);
            clip-path: circle(100% at center);
  }
}
.container {
  display: flex;
  flex-direction: column;
  align-items: center;
  overflow: auto;
  position: fixed;
  top: 0px;
  left: 0px;
  right: 0px;
  bottom: 0px;
  background: var(--background);
  color: var(--color);
}
.container:not(.dark) {
  --background: #fcfbfe;
  --color:#323133;
  --sectionBackground: #ffffff;
  --borderColor: #e9e9e9;
  --text1:#323133;
  --text2:#3C3B3D;
  --shadow:rgba(0,0,0,0.1);
  --iconColor:#0fce3d;
}
.container.dark {
  --background: #1C1B20;
  --color:#F5F7FA;
  --sectionBackground: #222126;
  --borderColor: #252429;
  --text1:#F5F7FA;
  --text2:#E6E9ED;
  --shadow:rgba(0,0,0,0.1);
  --iconColor:#05c534;
}
.container *[class*="card"] {
  background: var(--sectionBackground);
  color: var(--text1);
  box-shadow: 0 0 1rem -0.25rem var(--shadow);
}
.container *[class*="card"].inner-card {
  border: 1px solid var(--borderColor);
}
.container .darkmode {
  position: fixed;
  bottom: 1rem;
  left: 1rem;
  font-size: 1.75rem;
  padding: 1rem;
  margin: 1px;
  border-radius: 100%;
  border-color: var(--iconColor) !important;
  box-shadow: 0 0 1rem -0.25rem var(--iconColor), inset 0 0 1rem -0.75rem var(--iconColor);
  color: var(--iconColor);
  cursor: pointer;
  transition: .25s -.05s;
}
.container .darkmode:hover {
  box-shadow: 0 0 1rem -0.25rem var(--iconColor), inset 0 0 1rem -0.25rem var(--iconColor);
}
.container .section-width {
  max-width: 800px;
  width: calc(100vw - 8rem);
}
.container .header {
  z-index: 1;
  align-self: stretch;
  display: flex;
  flex-direction: row;
  justify-content: center;
  position: -webkit-sticky;
  position: sticky;
  top: 0;
  border-bottom: 1px solid var(--borderColor);
  height: 4rem;
  line-height: 4rem;
  font-size: 1.75rem;
}
.container .header .section-width {
  display: flex;
  flex-direction: row;
  justify-content: space-between;
}
.container .header .logotext  {
  font-weight: 900;
  letter-spacing: 1.2rem;
  color: var(--iconColor);
}
 
@-webkit-keyframes flash {
  0%, 50%, 100% {
    color: var(--iconColor);
  }
  70%, 80% {
    color: var(--text1);
  }
}
@keyframes flash {
  0%, 50%, 100% {
    color: var(--iconColor);
  }
  70%, 80% {
    color: var(--text1);
  }
}
body .container .page {
  position: relative;
  margin: 2rem 0;
  padding: 2rem;
}
body .container .page:not(:last-child) {
  margin-bottom: 0rem;
}
body .container .page:target-within {
  border-color: var(--iconColor) !important;
}
body .container .page h1, body .container .page h2, body .container .page h3, body .container .page h4, body .container .page h5, body .container .page h6 {
  margin: 0;
}
body .container .page h1:last-child, body .container .page h2:last-child, body .container .page h3:last-child, body .container .page h4:last-child, body .container .page h5:last-child, body .container .page h6:last-child {
  margin-bottom: 0;
}
body .container .page h1 {
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  padding-bottom: 1rem;
  border-bottom: 1px solid var(--borderColor);
}
body .container .page h1 a {
  text-decoration: none;
  font-weight: 200;
}
body .container .page h1 a:hover {
  font-weight: 400;
}
body .container .page p:last-child {
  margin-bottom: 0;
}
body .container .page a {
  color: var(--iconColor);
}
body .container .page a:not(:hover) {
  text-decoration: none;
}
body .container .page i {
  color: var(--text2);
  font-family: "Poly", sans-serif;
}
body .container .page ul {
  list-style: none;
  padding-left: 1rem;
}
body .container .page ul li:before {
  content: "•";
  margin-right: 1rem;
  color: var(--iconColor);
}
body .container .page > div[id] {
  position: absolute;
  top: calc(-6rem - 2px);
}
body iframe {
  top: unset !important;
  bottom: 9px;
  right: 25px !important;
}
function.js

The final step, Create a JavaScript file named ‘function.js‘ and put the codes.

// Code By Webdevtrick ( https://webdevtrick.com )
let buttonenabled = true, scroll = 0;
$(document).on("click", ".darkmode", function(){
	if(!buttonenabled) return;
	buttonenabled = false;
	$(".clip").html($("body >.container")[0].outerHTML); 
	scrollbind($(".clip .container"));
	$(".clip .container").toggleClass("dark").scrollTop(scroll); 
	$(".clip .darkmode").toggleClass("fa-moon").toggleClass("fa-sun"); 
	$(".clip").addClass("anim"); 
	setTimeout(function(){
		$("body >.container").replaceWith($(".clip").html()) 
		scrollbind($("body >.container")); 
		$("body >.container").scrollTop(scroll);
		$(".clip").html("").removeClass("anim"); 
		buttonenabled = true;
	}, 1000); 
});
 
const scrollbind = el => el.bind("scroll", function(){
	scroll = $(this).scrollTop();
	if($(".container").length > 1)
		$(".container").scrollTop(scroll); 
		
});
scrollbind($(".container"));
That’s It. Now you have successfully created CSS Dark Mode Toggle With Clip Path Animation, Dark / Light Mode Switch. 