export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export interface Database {
  public: {
    Tables: {
      empresas: {
        Row: {
          id: string;
          slug: string;
          nome: string;
          logo: string | null;
          cor_primaria: string | null;
          cor_secundaria: string | null;
          ativo: boolean;
          criado_em: string;
        };
        Insert: {
          id?: string;
          slug: string;
          nome: string;
          logo?: string | null;
          cor_primaria?: string | null;
          cor_secundaria?: string | null;
          ativo?: boolean;
          criado_em?: string;
        };
        Update: {
          id?: string;
          slug?: string;
          nome?: string;
          logo?: string | null;
          cor_primaria?: string | null;
          cor_secundaria?: string | null;
          ativo?: boolean;
          criado_em?: string;
        };
        Relationships: [];
      };
      perfis: {
        Row: {
          id: string;
          empresa_id: string;
          nome_completo: string;
          avatar_url: string | null;
          cargo_id: string | null;
          email: string;
          criado_em: string;
        };
        Insert: {
          id: string;
          empresa_id: string;
          nome_completo: string;
          avatar_url?: string | null;
          cargo_id?: string | null;
          email: string;
          criado_em?: string;
        };
        Update: {
          id?: string;
          empresa_id?: string;
          nome_completo?: string;
          avatar_url?: string | null;
          cargo_id?: string | null;
          email?: string;
          criado_em?: string;
        };
        Relationships: [
          {
            foreignKeyName: "perfis_cargo_id_fkey";
            columns: ["cargo_id"];
            isOneToOne: false;
            referencedRelation: "cargos";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "perfis_empresa_id_fkey";
            columns: ["empresa_id"];
            isOneToOne: false;
            referencedRelation: "empresas";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "perfis_id_fkey";
            columns: ["id"];
            isOneToOne: true;
            referencedRelation: "users";
            referencedColumns: ["id"];
          }
        ];
      };
      cargos: {
        Row: {
          id: string;
          empresa_id: string;
          nome: string;
          nivel: string | null;
          permissoes: Json;
          criado_em: string;
        };
        Insert: {
          id?: string;
          empresa_id: string;
          nome: string;
          nivel?: string | null;
          permissoes?: Json;
          criado_em?: string;
        };
        Update: {
          id?: string;
          empresa_id?: string;
          nome?: string;
          nivel?: string | null;
          permissoes?: Json;
          criado_em?: string;
        };
        Relationships: [
          {
            foreignKeyName: "cargos_empresa_id_fkey";
            columns: ["empresa_id"];
            isOneToOne: false;
            referencedRelation: "empresas";
            referencedColumns: ["id"];
          }
        ];
      };
      convites: {
        Row: {
          id: string;
          empresa_id: string;
          email: string;
          token: string;
          expira_em: string;
          usado: boolean;
          criado_em: string;
        };
        Insert: {
          id?: string;
          empresa_id: string;
          email: string;
          token: string;
          expira_em: string;
          usado?: boolean;
          criado_em?: string;
        };
        Update: {
          id?: string;
          empresa_id?: string;
          email?: string;
          token?: string;
          expira_em?: string;
          usado?: boolean;
          criado_em?: string;
        };
        Relationships: [
          {
            foreignKeyName: "convites_empresa_id_fkey";
            columns: ["empresa_id"];
            isOneToOne: false;
            referencedRelation: "empresas";
            referencedColumns: ["id"];
          }
        ];
      };
      audit_logs: {
        Row: {
          id: string;
          acao: string;
          usuario_id: string | null;
          empresa_id: string;
          timestamp: string;
          metadados: Json | null;
        };
        Insert: {
          id?: string;
          acao: string;
          usuario_id?: string | null;
          empresa_id: string;
          timestamp?: string;
          metadados?: Json | null;
        };
        Update: {
          id?: string;
          acao?: string;
          usuario_id?: string | null;
          empresa_id?: string;
          timestamp?: string;
          metadados?: Json | null;
        };
        Relationships: [
          {
            foreignKeyName: "audit_logs_empresa_id_fkey";
            columns: ["empresa_id"];
            isOneToOne: false;
            referencedRelation: "empresas";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "audit_logs_usuario_id_fkey";
            columns: ["usuario_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          }
        ];
      };
      noticias: {
        Row: {
          id: string;
          empresa_id: string;
          titulo: string;
          conteudo: string;
          publicado_em: string;
          autor_id: string | null;
        };
        Insert: {
          id?: string;
          empresa_id: string;
          titulo: string;
          conteudo: string;
          publicado_em?: string;
          autor_id?: string | null;
        };
        Update: {
          id?: string;
          empresa_id?: string;
          titulo?: string;
          conteudo?: string;
          publicado_em?: string;
          autor_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "noticias_autor_id_fkey";
            columns: ["autor_id"];
            isOneToOne: false;
            referencedRelation: "perfis";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "noticias_empresa_id_fkey";
            columns: ["empresa_id"];
            isOneToOne: false;
            referencedRelation: "empresas";
            referencedColumns: ["id"];
          }
        ];
      };
      contracheques: {
        Row: {
          id: string;
          perfil_id: string;
          empresa_id: string;
          mes_ano: string;
          url_documento: string;
          criado_em: string;
        };
        Insert: {
          id?: string;
          perfil_id: string;
          empresa_id: string;
          mes_ano: string;
          url_documento: string;
          criado_em?: string;
        };
        Update: {
          id?: string;
          perfil_id?: string;
          empresa_id?: string;
          mes_ano?: string;
          url_documento?: string;
          criado_em?: string;
        };
        Relationships: [
          {
            foreignKeyName: "contracheques_empresa_id_fkey";
            columns: ["empresa_id"];
            isOneToOne: false;
            referencedRelation: "empresas";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "contracheques_perfil_id_fkey";
            columns: ["perfil_id"];
            isOneToOne: false;
            referencedRelation: "perfis";
            referencedColumns: ["id"];
          }
        ];
      };
      beneficios: {
        Row: {
          id: string;
          empresa_id: string;
          nome: string;
          descricao: string | null;
          url_parceiro: string | null;
          criado_em: string;
        };
        Insert: {
          id?: string;
          empresa_id: string;
          nome: string;
          descricao?: string | null;
          url_parceiro?: string | null;
          criado_em?: string;
        };
        Update: {
          id?: string;
          empresa_id?: string;
          nome?: string;
          descricao?: string | null;
          url_parceiro?: string | null;
          criado_em?: string;
        };
        Relationships: [
          {
            foreignKeyName: "beneficios_empresa_id_fkey";
            columns: ["empresa_id"];
            isOneToOne: false;
            referencedRelation: "empresas";
            referencedColumns: ["id"];
          }
        ];
      };
      ponto_registros: {
        Row: {
          id: string;
          perfil_id: string;
          empresa_id: string;
          data: string;
          hora_entrada: string;
          hora_saida: string | null;
          criado_em: string;
        };
        Insert: {
          id?: string;
          perfil_id: string;
          empresa_id: string;
          data: string;
          hora_entrada: string;
          hora_saida?: string | null;
          criado_em?: string;
        };
        Update: {
          id?: string;
          perfil_id?: string;
          empresa_id?: string;
          data?: string;
          hora_entrada?: string;
          hora_saida?: string | null;
          criado_em?: string;
        };
        Relationships: [
          {
            foreignKeyName: "ponto_registros_empresa_id_fkey";
            columns: ["empresa_id"];
            isOneToOne: false;
            referencedRelation: "empresas";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "ponto_registros_perfil_id_fkey";
            columns: ["perfil_id"];
            isOneToOne: false;
            referencedRelation: "perfis";
            referencedColumns: ["id"];
          }
        ];
      };
      ferias_solicitacoes: {
        Row: {
          id: string;
          perfil_id: string;
          empresa_id: string;
          data_inicio: string;
          data_fim: string;
          status: string;
          criado_em: string;
        };
        Insert: {
          id?: string;
          perfil_id: string;
          empresa_id: string;
          data_inicio: string;
          data_fim: string;
          status?: string;
          criado_em?: string;
        };
        Update: {
          id?: string;
          perfil_id?: string;
          empresa_id?: string;
          data_inicio?: string;
          data_fim?: string;
          status?: string;
          criado_em?: string;
        };
        Relationships: [
          {
            foreignKeyName: "ferias_solicitacoes_empresa_id_fkey";
            columns: ["empresa_id"];
            isOneToOne: false;
            referencedRelation: "empresas";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "ferias_solicitacoes_perfil_id_fkey";
            columns: ["perfil_id"];
            isOneToOne: false;
            referencedRelation: "perfis";
            referencedColumns: ["id"];
          }
        ];
      };
      avaliacoes_desempenho: {
        Row: {
          id: string;
          avaliado_id: string;
          avaliador_id: string | null;
          empresa_id: string;
          periodo: string;
          auto_avaliacao: string | null;
          feedback_gestor: string | null;
          nota_final: number | null;
          criado_em: string;
        };
        Insert: {
          id?: string;
          avaliado_id: string;
          avaliador_id?: string | null;
          empresa_id: string;
          periodo: string;
          auto_avaliacao?: string | null;
          feedback_gestor?: string | null;
          nota_final?: number | null;
          criado_em?: string;
        };
        Update: {
          id?: string;
          avaliado_id?: string;
          avaliador_id?: string | null;
          empresa_id?: string;
          periodo?: string;
          auto_avaliacao?: string | null;
          feedback_gestor?: string | null;
          nota_final?: number | null;
          criado_em?: string;
        };
        Relationships: [
          {
            foreignKeyName: "avaliacoes_desempenho_avaliado_id_fkey";
            columns: ["avaliado_id"];
            isOneToOne: false;
            referencedRelation: "perfis";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "avaliacoes_desempenho_avaliador_id_fkey";
            columns: ["avaliador_id"];
            isOneToOne: false;
            referencedRelation: "perfis";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "avaliacoes_desempenho_empresa_id_fkey";
            columns: ["empresa_id"];
            isOneToOne: false;
            referencedRelation: "empresas";
            referencedColumns: ["id"];
          }
        ];
      };
      vagas_internas: {
        Row: {
          id: string;
          empresa_id: string;
          titulo: string;
          descricao: string;
          requisitos: string | null;
          data_publicacao: string;
          data_fechamento: string | null;
          criado_em: string;
        };
        Insert: {
          id?: string;
          empresa_id: string;
          titulo: string;
          descricao: string;
          requisitos?: string | null;
          data_publicacao?: string;
          data_fechamento?: string | null;
          criado_em?: string;
        };
        Update: {
          id?: string;
          empresa_id?: string;
          titulo?: string;
          descricao?: string;
          requisitos?: string | null;
          data_publicacao?: string;
          data_fechamento?: string | null;
          criado_em?: string;
        };
        Relationships: [
          {
            foreignKeyName: "vagas_internas_empresa_id_fkey";
            columns: ["empresa_id"];
            isOneToOne: false;
            referencedRelation: "empresas";
            referencedColumns: ["id"];
          }
        ];
      };
      treinamentos: {
        Row: {
          id: string;
          empresa_id: string;
          titulo: string;
          descricao: string | null;
          url_conteudo: string | null;
          criado_em: string;
        };
        Insert: {
          id?: string;
          empresa_id: string;
          titulo: string;
          descricao?: string | null;
          url_conteudo?: string | null;
          criado_em?: string;
        };
        Update: {
          id?: string;
          empresa_id?: string;
          titulo?: string;
          descricao?: string | null;
          url_conteudo?: string | null;
          criado_em?: string;
        };
        Relationships: [
          {
            foreignKeyName: "treinamentos_empresa_id_fkey";
            columns: ["empresa_id"];
            isOneToOne: false;
            referencedRelation: "empresas";
            referencedColumns: ["id"];
          }
        ];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      get_empresa_id: {
        Args: {};
        Returns: string;
      };
      is_super_admin: {
        Args: {};
        Returns: boolean;
      };
      is_rh_admin: {
        Args: {};
        Returns: boolean;
      };
      is_gestor: {
        Args: {};
        Returns: boolean;
      };
      get_empresa_id_from_storage_path: {
        Args: {
          object_name: string;
        };
        Returns: string;
      };
      get_perfil_id_from_storage_path: {
        Args: {
          object_name: string;
        };
        Returns: string;
      };
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
}

export type Tables<
  PublicTableNameOrOptions extends
    | keyof (Database["public"]["Tables"] & Database["public"]["Views"])
    | {
        schema: keyof Database;
        table: keyof (Database[NonNullable<PublicTableNameOrOptions>["schema"]]["Tables"] & Database[NonNullable<PublicTableNameOrOptions>["schema"]]["Views"])
      },
  TableName extends PublicTableNameOrOptions extends { table: any } ? PublicTableNameOrOptions["table"] : never = never
> = PublicTableNameOrOptions extends { schema: keyof Database; table: keyof (Database[NonNullable<PublicTableNameOrOptions>["schema"]]["Tables"] & Database[NonNullable<PublicTableNameOrOptions>["schema"]]["Views"]) } ? (Database[PublicTableNameOrOptions["schema"]]["Tables"] & Database[PublicTableNameOrOptions["schema"]]["Views"])[TableName] : PublicTableNameOrOptions extends keyof (Database["public"]["Tables"] & Database["public"]["Views"]) ? (Database["public"]["Tables"] & Database["public"]["Views"])[PublicTableNameOrOptions] : never;

export type TablesInsert<
  PublicTableNameOrOptions extends
    | keyof Database["public"]["Tables"]
    | {
        schema: keyof Database;
        table: keyof Database[NonNullable<PublicTableNameOrOptions>["schema"]]["Tables"]
      },
  TableName extends PublicTableNameOrOptions extends { table: any } ? PublicTableNameOrOptions["table"] : never = never
> = PublicTableNameOrOptions extends { schema: keyof Database; table: keyof Database[NonNullable<PublicTableNameOrOptions>["schema"]]["Tables"] } ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName]["Insert"] : PublicTableNameOrOptions extends keyof Database["public"]["Tables"] ? Database["public"]["Tables"][PublicTableNameOrOptions]["Insert"] : never;

export type TablesUpdate<
  PublicTableNameOrOptions extends
    | keyof Database["public"]["Tables"]
    | {
        schema: keyof Database;
        table: keyof Database[NonNullable<PublicTableNameOrOptions>["schema"]]["Tables"]
      },
  TableName extends PublicTableNameOrOptions extends { table: any } ? PublicTableNameOrOptions["table"] : never = never
> = PublicTableNameOrOptions extends { schema: keyof Database; table: keyof Database[NonNullable<PublicTableNameOrOptions>["schema"]]["Tables"] } ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName]["Update"] : PublicTableNameOrOptions extends keyof Database["public"]["Tables"] ? Database["public"]["Tables"][PublicTableNameOrOptions]["Update"] : never;

export type Enums<
  PublicEnumNameOrOptions extends
    | keyof Database["public"]["Enums"]
    | {
        schema: keyof Database;
        enum: keyof Database[NonNullable<PublicEnumNameOrOptions>["schema"]]["Enums"]
      },
  EnumName extends PublicEnumNameOrOptions extends { enum: any } ? PublicEnumNameOrOptions["enum"] : never = never
> = PublicEnumNameOrOptions extends { schema: keyof Database; enum: keyof Database[NonNullable<PublicEnumNameOrOptions>["schema"]]["Enums"] } ? Database[PublicEnumNameOrOptions["schema"]]["Enums"][EnumName] : PublicEnumNameOrOptions extends keyof Database["public"]["Enums"] ? Database["public"]["Enums"][PublicEnumNameOrOptions] : never;
