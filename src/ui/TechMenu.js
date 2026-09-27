import { TECH_NODES } from "../config/progression.js";

export class TechMenu {
  constructor(progression) {
    this.progression = progression;
    this.root = document.getElementById("tech");
    this.list = document.getElementById("tech-list");
    this.esenciaEl = document.getElementById("tech-esencia");
    this.open = false;

    document.getElementById("btn-tech").addEventListener("click", () => this.toggle());
    document.getElementById("tech-close").addEventListener("click", () => this.toggle());
  }

  toggle() {
    this.open = !this.open;
    this.root.classList.toggle("open", this.open);
    if (this.open) this.render();
  }

  render() {
    this.esenciaEl.textContent = this.progression.esencia();
    this.list.innerHTML = "";

    for (const node of TECH_NODES) {
      const owned = this.progression.has(node.id);
      const can = !owned && this.progression.esencia() >= node.cost;
      const div = document.createElement("div");
      div.className = "tech-node" + (owned ? " owned" : can ? "" : " cant");

      const name = document.createElement("div");
      name.className = "tname";
      name.textContent = node.name;

      const desc = document.createElement("div");
      desc.className = "tdesc";
      desc.textContent = node.desc;

      const btn = document.createElement("button");
      if (owned) {
        btn.textContent = "Desbloqueado";
        btn.disabled = true;
      } else {
        btn.textContent = `Comprar (${node.cost})`;
        btn.disabled = !can;
        btn.addEventListener("click", () => {
          if (this.progression.purchase(node.id)) this.render();
        });
      }

      div.append(name, desc, btn);
      this.list.append(div);
    }
  }
}
