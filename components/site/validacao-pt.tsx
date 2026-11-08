"use client";

import { useEffect } from "react";

type Campo = HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement;

// Os avisos de campo inválido vêm do navegador, no idioma do sistema ("Please fill out this field.").
// Aqui eles são trocados por textos em português em todos os formulários do site e do admin.
function mensagem(el: Campo): string {
  const v = el.validity;
  const tipo = el instanceof HTMLInputElement ? el.type : "";
  if (v.valueMissing) {
    if (tipo === "checkbox") return "Marque esta opção para continuar.";
    if (tipo === "radio") return "Escolha uma das opções.";
    if (el instanceof HTMLSelectElement) return "Escolha uma opção da lista.";
    return "Preencha este campo.";
  }
  if (v.typeMismatch) return tipo === "email" ? "Digite um e-mail válido, como nome@exemplo.com." : "Confira o formato deste campo.";
  if (v.tooShort && "minLength" in el) return `Use pelo menos ${el.minLength} caracteres.`;
  if (v.tooLong && "maxLength" in el) return `Use no máximo ${el.maxLength} caracteres.`;
  if (v.patternMismatch) return el.title || "Confira o formato deste campo.";
  if (v.rangeUnderflow || v.rangeOverflow || v.stepMismatch || v.badInput) return "Confira o valor deste campo.";
  return "";
}

const ehCampo = (t: EventTarget | null): t is Campo =>
  t instanceof HTMLInputElement || t instanceof HTMLTextAreaElement || t instanceof HTMLSelectElement;

export function ValidacaoPt() {
  useEffect(() => {
    const aoInvalidar = (e: Event) => {
      if (!ehCampo(e.target)) return;
      e.target.setCustomValidity("");
      e.target.setCustomValidity(mensagem(e.target));
    };
    // ao editar, limpa o aviso (nos radios, o do grupo inteiro) para o campo poder ficar válido de novo
    const aoEditar = (e: Event) => {
      if (!ehCampo(e.target)) return;
      const el = e.target;
      if (el instanceof HTMLInputElement && el.type === "radio" && el.name && el.form) {
        for (const r of el.form.querySelectorAll<HTMLInputElement>(`input[type="radio"][name="${CSS.escape(el.name)}"]`)) r.setCustomValidity("");
      } else el.setCustomValidity("");
    };
    document.addEventListener("invalid", aoInvalidar, true);
    document.addEventListener("input", aoEditar, true);
    document.addEventListener("change", aoEditar, true);
    return () => {
      document.removeEventListener("invalid", aoInvalidar, true);
      document.removeEventListener("input", aoEditar, true);
      document.removeEventListener("change", aoEditar, true);
    };
  }, []);
  return null;
}
