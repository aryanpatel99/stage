// Mesh gradient backgrounds using CSS gradients
export const meshGradients = {
  mesh_aurora: 'radial-gradient(at 40% 20%, hsla(330,100%,75%,1) 0px, transparent 50%), radial-gradient(at 80% 0%, hsla(190,100%,75%,1) 0px, transparent 50%), radial-gradient(at 0% 50%, hsla(270,100%,75%,1) 0px, transparent 50%), radial-gradient(at 80% 50%, hsla(39,100%,75%,1) 0px, transparent 50%), radial-gradient(at 0% 100%, hsla(210,100%,75%,1) 0px, transparent 50%), radial-gradient(at 80% 100%, hsla(150,100%,75%,1) 0px, transparent 50%), radial-gradient(at 0% 0%, hsla(60,100%,75%,1) 0px, transparent 50%)',
  mesh_sunset: 'radial-gradient(at 0% 0%, hsla(355,85%,65%,1) 0px, transparent 50%), radial-gradient(at 100% 0%, hsla(30,100%,75%,1) 0px, transparent 50%), radial-gradient(at 100% 100%, hsla(290,85%,55%,1) 0px, transparent 50%), radial-gradient(at 0% 100%, hsla(15,100%,60%,1) 0px, transparent 50%)',
  mesh_ocean: 'radial-gradient(at 50% 0%, hsla(200,100%,75%,1) 0px, transparent 50%), radial-gradient(at 100% 50%, hsla(190,100%,60%,1) 0px, transparent 50%), radial-gradient(at 0% 50%, hsla(180,100%,65%,1) 0px, transparent 50%), radial-gradient(at 50% 100%, hsla(220,100%,45%,1) 0px, transparent 50%)',
  mesh_forest: 'radial-gradient(at 40% 40%, hsla(120,80%,60%,1) 0px, transparent 50%), radial-gradient(at 80% 20%, hsla(90,70%,75%,1) 0px, transparent 50%), radial-gradient(at 20% 80%, hsla(150,80%,45%,1) 0px, transparent 50%), radial-gradient(at 90% 90%, hsla(60,100%,65%,1) 0px, transparent 50%)',
  mesh_candy: 'radial-gradient(at 30% 30%, hsla(340,100%,75%,1) 0px, transparent 50%), radial-gradient(at 70% 20%, hsla(280,100%,75%,1) 0px, transparent 50%), radial-gradient(at 20% 70%, hsla(45,100%,80%,1) 0px, transparent 50%), radial-gradient(at 80% 80%, hsla(330,100%,70%,1) 0px, transparent 50%)',
  mesh_cosmic: 'radial-gradient(at 10% 10%, hsla(260,100%,40%,1) 0px, transparent 50%), radial-gradient(at 90% 10%, hsla(300,100%,50%,1) 0px, transparent 50%), radial-gradient(at 50% 50%, hsla(220,100%,30%,1) 0px, transparent 50%), radial-gradient(at 90% 90%, hsla(190,100%,60%,1) 0px, transparent 50%), radial-gradient(at 10% 90%, hsla(270,100%,60%,1) 0px, transparent 50%)',
  mesh_peach: 'radial-gradient(at 0% 0%, hsla(25,100%,85%,1) 0px, transparent 50%), radial-gradient(at 100% 0%, hsla(340,100%,85%,1) 0px, transparent 50%), radial-gradient(at 100% 100%, hsla(30,100%,75%,1) 0px, transparent 50%), radial-gradient(at 0% 100%, hsla(15,100%,80%,1) 0px, transparent 50%)',
  mesh_lavender: 'radial-gradient(at 20% 20%, hsla(280,80%,80%,1) 0px, transparent 50%), radial-gradient(at 80% 20%, hsla(260,90%,85%,1) 0px, transparent 50%), radial-gradient(at 50% 80%, hsla(300,70%,75%,1) 0px, transparent 50%)',
  mesh_mint: 'radial-gradient(at 40% 20%, hsla(160,80%,75%,1) 0px, transparent 50%), radial-gradient(at 80% 60%, hsla(180,70%,80%,1) 0px, transparent 50%), radial-gradient(at 0% 80%, hsla(140,80%,70%,1) 0px, transparent 50%)',
  mesh_rose: 'radial-gradient(at 30% 30%, hsla(350,90%,80%,1) 0px, transparent 50%), radial-gradient(at 70% 70%, hsla(330,80%,75%,1) 0px, transparent 50%), radial-gradient(at 70% 30%, hsla(10,90%,85%,1) 0px, transparent 50%)',
  mesh_electric: 'radial-gradient(at 0% 50%, hsla(180,100%,50%,1) 0px, transparent 50%), radial-gradient(at 100% 50%, hsla(290,100%,60%,1) 0px, transparent 50%), radial-gradient(at 50% 0%, hsla(200,100%,70%,1) 0px, transparent 50%), radial-gradient(at 50% 100%, hsla(270,100%,50%,1) 0px, transparent 50%)',
  mesh_warm: 'radial-gradient(at 20% 30%, hsla(35,100%,70%,1) 0px, transparent 50%), radial-gradient(at 80% 30%, hsla(15,100%,65%,1) 0px, transparent 50%), radial-gradient(at 50% 80%, hsla(45,100%,75%,1) 0px, transparent 50%)',
};

export type MeshGradientKey = keyof typeof meshGradients;

// Magic/animated gradients (these will use CSS animations when rendered)
export const magicGradients = {
  magic_rainbow: 'linear-gradient(90deg, hsla(0,100%,70%,1), hsla(60,100%,70%,1), hsla(120,100%,70%,1), hsla(180,100%,70%,1), hsla(240,100%,70%,1), hsla(300,100%,70%,1), hsla(360,100%,70%,1))',
  magic_neon: 'linear-gradient(135deg, hsla(280,100%,70%,1), hsla(190,100%,60%,1), hsla(280,100%,70%,1))',
  magic_fire: 'linear-gradient(135deg, hsla(0,100%,50%,1), hsla(30,100%,55%,1), hsla(45,100%,60%,1), hsla(30,100%,55%,1), hsla(0,100%,50%,1))',
  magic_ice: 'linear-gradient(135deg, hsla(200,100%,80%,1), hsla(210,100%,70%,1), hsla(220,100%,60%,1), hsla(210,100%,70%,1), hsla(200,100%,80%,1))',
  magic_aurora_borealis: 'linear-gradient(135deg, hsla(150,100%,50%,1), hsla(180,100%,60%,1), hsla(280,100%,60%,1), hsla(180,100%,60%,1), hsla(150,100%,50%,1))',
  magic_sunset_wave: 'linear-gradient(135deg, hsla(350,100%,60%,1), hsla(30,100%,70%,1), hsla(350,100%,60%,1))',
  magic_cosmic_dust: 'linear-gradient(135deg, hsla(270,100%,30%,1), hsla(290,100%,50%,1), hsla(320,100%,60%,1), hsla(290,100%,50%,1), hsla(270,100%,30%,1))',
  magic_ocean_wave: 'linear-gradient(135deg, hsla(200,100%,40%,1), hsla(180,100%,60%,1), hsla(160,100%,50%,1), hsla(180,100%,60%,1), hsla(200,100%,40%,1))',
};

export type MagicGradientKey = keyof typeof magicGradients;
