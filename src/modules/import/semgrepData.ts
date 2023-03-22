export interface SemgrepData {
  paths: any;
  results: {
      check_id: string;
      path: string;
      start: {
          line: number;
      };
      extra: {
          message: string;
      };
  }[];
}