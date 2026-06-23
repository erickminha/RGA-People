version: 2
updates:
  # Atualizações de pacotes npm
  - package-ecosystem: "npm"
    directory: "/"
    schedule:
      interval: "weekly"
      day: "monday"
      time: "09:00"
      timezone: "America/Sao_Paulo"
    open-pull-requests-limit: 5
    reviewers:
      - "Eric-Gomes-Caminha"
    commit-message:
      prefix: "chore(deps)"
      include: "scope"
    labels:
      - "dependencies"
      - "automated"
    groups:
      production:
        dependency-type: "production"
        update-types:
          - "minor"
          - "patch"
      development:
        dependency-type: "development"
        update-types:
          - "minor"
          - "patch"

  # Atualizações de GitHub Actions
  - package-ecosystem: "github-actions"
    directory: "/"
    schedule:
      interval: "monthly"
    commit-message:
      prefix: "chore(ci)"
    labels:
      - "ci"
      - "automated"
