# Motion and 3D

The signature composition is a deliberately layered print stack: foreground lake photograph, supporting mountain print and a quiet archival backing. Perspective and transform depth create a recognizable photographic object without loading WebGL.

`Tilt` updates CSS variables directly from fine-pointer position. Maximum movement is 2.5 degrees per axis. Touch and coarse-pointer devices do not need hover to reveal information. A 300ms settling transition returns the stack and memory cards to rest. Controls use about 180ms, panels/page entrance about 350ms and image emphasis about 500ms. There is no scroll jacking, ambient GPU loop, particle field or artificial save delay.

The native dialog provides photo lightbox focus containment, Escape handling and focus restoration. Pointer-responsive depth does not obscure text or block controls. Core route links and content work independently of decorative transforms.

`prefers-reduced-motion: reduce` disables decorative transforms, animations, smooth scrolling and hover movement. Browser checks verify the computed print-stack transform becomes `none`. Keyboard/touch flows remain available.

Not claimed: a WebGL scene, continuous device frame-rate measurements, animation on every album cover or shared-element cinematic detail morphs. The implemented selected CSS effects meet the lightweight 3D direction; further cinematic transitions remain a refinement, not a substitute for core functionality.
