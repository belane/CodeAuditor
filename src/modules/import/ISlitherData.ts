export interface ISlitherData {
  success: boolean;
  results: {
      detectors: {
          check: string;
          description: string;
          elements: {
              name: string;
              type: string;
              source_mapping: {
                  filename_relative: string;
                  lines: number[];
              }
          }[];
      }[];
  };
}
