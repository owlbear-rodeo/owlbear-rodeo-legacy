import axes from "./Axes.png";
import bird from "./Bird.png";
import book from "./Book.png";
import crown from "./Crown.png";
import dragon from "./Dragon.png";
import eye from "./Eye.png";
import fist from "./Fist.png";
import horse from "./Horse.png";
import leaf from "./Leaf.png";
import lion from "./Lion.png";
import money from "./Money.png";
import moon from "./Moon.png";
import potion from "./Potion.png";
import shield from "./Shield.png";
import skull from "./Skull.png";
import snake from "./Snake.png";
import sun from "./Sun.png";
import swords from "./Swords.png";
import tree from "./Tree.png";
import triangle from "./Triangle.png";

export const tokenSources = {
  axes,
  bird,
  book,
  crown,
  dragon,
  eye,
  fist,
  horse,
  leaf,
  lion,
  money,
  moon,
  potion,
  shield,
  skull,
  snake,
  sun,
  swords,
  tree,
  triangle,
};

export const tokens = Object.keys(tokenSources).map((name) => ({
  name,
  type: "default",
}));
