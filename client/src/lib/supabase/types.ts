export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.5"
  }
  api: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      calendar_events: {
        Row: {
          all_day: boolean | null
          created_at: string | null
          created_by: string | null
          ends_at: string | null
          id: string | null
          location: string | null
          org_id: string | null
          project_id: string | null
          recurrence: string | null
          starts_at: string | null
          team_id: string | null
          title: string | null
        }
        Insert: {
          all_day?: boolean | null
          created_at?: string | null
          created_by?: string | null
          ends_at?: string | null
          id?: string | null
          location?: string | null
          org_id?: string | null
          project_id?: string | null
          recurrence?: string | null
          starts_at?: string | null
          team_id?: string | null
          title?: string | null
        }
        Update: {
          all_day?: boolean | null
          created_at?: string | null
          created_by?: string | null
          ends_at?: string | null
          id?: string | null
          location?: string | null
          org_id?: string | null
          project_id?: string | null
          recurrence?: string | null
          starts_at?: string | null
          team_id?: string | null
          title?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          id: string | null
          is_admin: boolean | null
          org_id: string | null
        }
        Insert: {
          id?: string | null
          is_admin?: boolean | null
          org_id?: string | null
        }
        Update: {
          id?: string | null
          is_admin?: boolean | null
          org_id?: string | null
        }
        Relationships: []
      }
      projects: {
        Row: {
          created_at: string | null
          description: string | null
          due_date: string | null
          id: string | null
          key: string | null
          name: string | null
          org_id: string | null
          start_date: string | null
          status: "active" | "paused" | "archived" | null
          team_id: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          due_date?: string | null
          id?: string | null
          key?: string | null
          name?: string | null
          org_id?: string | null
          start_date?: string | null
          status?: "active" | "paused" | "archived" | null
          team_id?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          due_date?: string | null
          id?: string | null
          key?: string | null
          name?: string | null
          org_id?: string | null
          start_date?: string | null
          status?: "active" | "paused" | "archived" | null
          team_id?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      tasks: {
        Row: {
          assignee_id: string | null
          created_at: string | null
          description: string | null
          done: boolean | null
          due_date: string | null
          id: string | null
          order_index: number | null
          org_id: string | null
          parent_id: string | null
          priority: "low" | "medium" | "high" | "urgent" | null
          project_id: string | null
          reporter_id: string | null
          status: "todo" | "in_progress" | "done" | null
          team_id: string | null
          title: string | null
          updated_at: string | null
        }
        Insert: {
          assignee_id?: string | null
          created_at?: string | null
          description?: string | null
          done?: boolean | null
          due_date?: string | null
          id?: string | null
          order_index?: number | null
          org_id?: string | null
          parent_id?: string | null
          priority?: "low" | "medium" | "high" | "urgent" | null
          project_id?: string | null
          reporter_id?: string | null
          status?: "todo" | "in_progress" | "done" | null
          team_id?: string | null
          title?: string | null
          updated_at?: string | null
        }
        Update: {
          assignee_id?: string | null
          created_at?: string | null
          description?: string | null
          done?: boolean | null
          due_date?: string | null
          id?: string | null
          order_index?: number | null
          org_id?: string | null
          parent_id?: string | null
          priority?: "low" | "medium" | "high" | "urgent" | null
          project_id?: string | null
          reporter_id?: string | null
          status?: "todo" | "in_progress" | "done" | null
          team_id?: string | null
          title?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      team_member_users: {
        Row: {
          created_at: string | null
          email: string | null
          name: string | null
          org_id: string | null
          role: string | null
          team_id: string | null
          user_id: string | null
        }
        Relationships: []
      }
      team_members: {
        Row: {
          created_at: string | null
          org_id: string | null
          role: string | null
          team_id: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          org_id?: string | null
          role?: string | null
          team_id?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          org_id?: string | null
          role?: string | null
          team_id?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      teams: {
        Row: {
          created_at: string | null
          description: string | null
          id: string | null
          name: string | null
          org_id: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string | null
          name?: string | null
          org_id?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string | null
          name?: string | null
          org_id?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      users: {
        Row: {
          email: string | null
          id: string | null
          name: string | null
        }
        Insert: {
          email?: string | null
          id?: string | null
          name?: string | null
        }
        Update: {
          email?: string | null
          id?: string | null
          name?: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      project_delete: { Args: { _id: string }; Returns: undefined }
      project_upsert:
        | {
            Args: {
              _description: string
              _id: string
              _name: string
              _org_id: string
              _team_id: string
            }
            Returns: {
              created_at: string | null
              description: string | null
              due_date: string | null
              id: string | null
              key: string | null
              name: string | null
              org_id: string | null
              start_date: string | null
              status: "active" | "paused" | "archived" | null
              team_id: string | null
              updated_at: string | null
            }
            SetofOptions: {
              from: "*"
              to: "projects"
              isOneToOne: true
              isSetofReturn: false
            }
          }
        | {
            Args: {
              _description?: string
              _id?: string
              _name: string
              _org_id: string
              _team_id?: string
            }
            Returns: {
              created_at: string | null
              description: string | null
              due_date: string | null
              id: string | null
              key: string | null
              name: string | null
              org_id: string | null
              start_date: string | null
              status: "active" | "paused" | "archived" | null
              team_id: string | null
              updated_at: string | null
            }
            SetofOptions: {
              from: "*"
              to: "projects"
              isOneToOne: true
              isSetofReturn: false
            }
          }
      task_delete: { Args: { _id: string }; Returns: undefined }
      task_upsert: {
        Args: {
          _assignee_id?: string
          _description?: string
          _due_date?: string
          _id?: string
          _org_id: string
          _project_id: string
          _status?: "todo" | "in_progress" | "done"
          _team_id?: string
          _title?: string
        }
        Returns: {
          assignee_id: string | null
          created_at: string | null
          description: string | null
          done: boolean | null
          due_date: string | null
          id: string | null
          order_index: number | null
          org_id: string | null
          parent_id: string | null
          priority: "low" | "medium" | "high" | "urgent" | null
          project_id: string | null
          reporter_id: string | null
          status: "todo" | "in_progress" | "done" | null
          team_id: string | null
          title: string | null
          updated_at: string | null
        }
        SetofOptions: {
          from: "*"
          to: "tasks"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      team_add_member: {
        Args: {
          _org_id: string
          _role?: string
          _team_id: string
          _user_id: string
        }
        Returns: {
          created_at: string | null
          org_id: string | null
          role: string | null
          team_id: string | null
          user_id: string | null
        }
        SetofOptions: {
          from: "*"
          to: "team_members"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      team_delete: { Args: { _id: string }; Returns: undefined }
      team_remove_member: {
        Args: { _org_id: string; _team_id: string; _user_id: string }
        Returns: undefined
      }
      team_upsert: {
        Args: {
          _description?: string
          _id?: string
          _name: string
          _org_id: string
        }
        Returns: {
          created_at: string | null
          description: string | null
          id: string | null
          name: string | null
          org_id: string | null
          updated_at: string | null
        }
        SetofOptions: {
          from: "*"
          to: "teams"
          isOneToOne: true
          isSetofReturn: false
        }
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  api: {
    Enums: {},
  },
} as const
